# Autonomous Dataset Search Agent - 设计文档

## 概述

实现一个自主的数据集搜索、评估和下载代理，能够根据用户需求自动从多个平台找到最合适的数据集。

## 架构设计

### 1. 核心架构：API优先 + Selenium降级

```
┌─────────────────────────────────────────────────────────┐
│           Autonomous Dataset Search Agent               │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  API层       │        │  Selenium层  │
│  (优先使用)  │        │  (降级方案)  │
└──────┬───────┘        └──────┬───────┘
       │                       │
       ├─ HuggingFace API     ├─ Google Dataset Search
       ├─ ModelScope API      ├─ OpenDataLab (部分)
       ├─ Kaggle API          └─ Papers with Code
       └─ OpenDataLab API
                    │
                    ▼
        ┌───────────────────────┐
        │   评估引擎 (LLM)      │
        │   - 多维度评分        │
        │   - 智能决策          │
        │   - 置信度评估        │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   下载管理器          │
        │   - 断点续传          │
        │   - 格式转换          │
        │   - 自动导入          │
        └───────────────────────┘
```

## 2. API集成方案

### HuggingFace (推荐使用官方SDK)

```python
# 安装: pip install huggingface-hub
from huggingface_hub import HfApi, list_datasets, hf_hub_download

class HuggingFaceSearcher:
    def __init__(self, token: str = None):
        self.api = HfApi(token=token)

    async def search(self, query: str, task: str = None, limit: int = 20):
        """搜索数据集"""
        datasets = list_datasets(
            search=query,
            filter=f"task_categories:{task}" if task else None,
            sort="downloads",
            limit=limit
        )

        results = []
        for ds in datasets:
            info = self.api.dataset_info(ds.id)
            results.append({
                'id': ds.id,
                'name': info.id,
                'downloads': info.downloads,
                'likes': info.likes,
                'last_modified': info.lastModified,
                'tags': info.tags,
                'description': info.description,
                'card_data': info.cardData,
                'size': self._estimate_size(info),
                'license': info.cardData.get('license') if info.cardData else None,
            })

        return results

    async def download(self, dataset_id: str, output_dir: str):
        """下载数据集"""
        from datasets import load_dataset

        dataset = load_dataset(dataset_id)
        dataset.save_to_disk(output_dir)

        return output_dir

    def _estimate_size(self, info):
        """估算数据集大小"""
        if hasattr(info, 'size_bytes'):
            return info.size_bytes
        # 从README或其他元数据估算
        return None
```

**API文档**: https://huggingface.co/docs/huggingface_hub/

---

### ModelScope (官方SDK)

```python
# 安装: pip install modelscope
from modelscope.hub.api import HubApi

class ModelScopeSearcher:
    def __init__(self, token: str = None):
        self.api = HubApi()
        if token:
            self.api.login(token)

    async def search(self, query: str, task: str = None, limit: int = 20):
        """搜索数据集"""
        results = self.api.list_datasets(
            query=query,
            task=task,
            page_size=limit,
            sort='download_count'
        )

        datasets = []
        for item in results:
            detail = self.api.get_dataset(item['DatasetId'])
            datasets.append({
                'id': item['DatasetId'],
                'name': item['DatasetName'],
                'downloads': item.get('Downloads', 0),
                'likes': item.get('Likes', 0),
                'last_modified': item.get('GmtModified'),
                'description': detail.get('Description'),
                'tags': item.get('Tags', []),
                'size': detail.get('Size'),
                'license': detail.get('License'),
            })

        return datasets

    async def download(self, dataset_id: str, output_dir: str):
        """下载数据集"""
        from modelscope.msdatasets import MsDataset

        dataset = MsDataset.load(dataset_id)
        # 保存到本地
        dataset.save_to_disk(output_dir)

        return output_dir
```

**API文档**: https://modelscope.cn/docs/

---

### Kaggle (官方API)

```python
# 安装: pip install kaggle
import kaggle
from kaggle.api.kaggle_api_extended import KaggleApi

class KaggleSearcher:
    def __init__(self):
        self.api = KaggleApi()
        self.api.authenticate()

    async def search(self, query: str, limit: int = 20):
        """搜索数据集"""
        datasets = self.api.dataset_list(
            search=query,
            sort_by='hottest',
            max_size=limit
        )

        results = []
        for ds in datasets:
            results.append({
                'id': ds.ref,
                'name': ds.title,
                'owner': ds.creator_name,
                'downloads': ds.downloadCount,
                'votes': ds.voteCount,
                'last_modified': ds.lastUpdated,
                'size': ds.totalBytes,
                'license': ds.licenseName,
                'description': ds.description,
                'url': f'https://www.kaggle.com/datasets/{ds.ref}'
            })

        return results

    async def download(self, dataset_ref: str, output_dir: str):
        """下载数据集"""
        self.api.dataset_download_files(
            dataset_ref,
            path=output_dir,
            unzip=True
        )

        return output_dir
```

**配置**: 需要在 `~/.kaggle/kaggle.json` 放置API凭证
**API文档**: https://github.com/Kaggle/kaggle-api

---

### OpenDataLab (部分API支持)

```python
# 安装: pip install openxlab
from openxlab.dataset import info, download

class OpenDataLabSearcher:
    def __init__(self, token: str = None):
        self.token = token

    async def search(self, query: str, limit: int = 20):
        """搜索数据集（需要网页爬取辅助）"""
        # OpenDataLab的API较为有限，可能需要配合网页爬取
        # 这里提供下载功能
        pass

    async def download(self, dataset_id: str, output_dir: str):
        """下载数据集"""
        download(
            dataset_repo=dataset_id,
            target_path=output_dir
        )

        return output_dir

    async def get_info(self, dataset_id: str):
        """获取数据集信息"""
        dataset_info = info(dataset_repo=dataset_id)
        return {
            'id': dataset_id,
            'name': dataset_info.get('name'),
            'description': dataset_info.get('description'),
            'size': dataset_info.get('size'),
            'files': dataset_info.get('files', [])
        }
```

**API文档**: https://openxlab.org.cn/docs/

---

## 3. Selenium降级方案（仅用于无API的平台）

### Google Dataset Search

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class GoogleDatasetSearcher:
    def __init__(self):
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')  # 无头模式
        options.add_argument('--no-sandbox')
        self.driver = None

    def _init_driver(self):
        if not self.driver:
            self.driver = webdriver.Chrome(options=self.options)

    async def search(self, query: str, limit: int = 20):
        """搜索Google Dataset Search"""
        self._init_driver()

        url = f"https://datasetsearch.research.google.com/search?query={query}"
        self.driver.get(url)

        # 等待结果加载
        wait = WebDriverWait(self.driver, 10)
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "dataset-card")))

        # 提取数据集信息
        results = []
        cards = self.driver.find_elements(By.CSS_SELECTOR, ".dataset-card")[:limit]

        for card in cards:
            try:
                title = card.find_element(By.CSS_SELECTOR, ".title").text
                description = card.find_element(By.CSS_SELECTOR, ".description").text
                provider = card.find_element(By.CSS_SELECTOR, ".provider").text
                link = card.find_element(By.TAG_NAME, "a").get_attribute("href")

                results.append({
                    'name': title,
                    'description': description,
                    'provider': provider,
                    'url': link
                })
            except Exception as e:
                continue

        return results

    def close(self):
        if self.driver:
            self.driver.quit()
```

**注意**:
- Selenium应该是最后的备选方案
- 仅用于确实没有API的平台
- 需要处理反爬虫机制（User-Agent、代理、限速等）

---

## 4. 评估引擎（核心决策模块）

```python
from typing import List, Dict
import asyncio
from openai import AsyncOpenAI

class DatasetEvaluationEngine:
    """数据集评估引擎：使用多维度评分 + LLM决策"""

    def __init__(self, llm_client: AsyncOpenAI):
        self.llm = llm_client

    def calculate_score(self, dataset: Dict) -> float:
        """计算数据集综合评分 (0-100)"""
        score = 0

        # 1. 流行度得分 (30分)
        downloads = dataset.get('downloads', 0)
        score += min(downloads / 10000, 1.0) * 30

        # 2. 时效性得分 (20分)
        from datetime import datetime, timedelta
        last_modified = dataset.get('last_modified')
        if last_modified:
            days_ago = (datetime.now() - last_modified).days
            freshness = max(0, 1 - days_ago / 365)
            score += freshness * 20

        # 3. 文档质量得分 (20分)
        description_length = len(dataset.get('description', ''))
        has_readme = 'card_data' in dataset or 'readme' in dataset
        doc_score = min(description_length / 1000, 0.5) * 20
        if has_readme:
            doc_score += 10
        score += doc_score

        # 4. 社区认可度 (15分)
        likes = dataset.get('likes', 0) or dataset.get('votes', 0)
        score += min(likes / 100, 1.0) * 15

        # 5. 许可证友好度 (10分)
        license = dataset.get('license', '').lower()
        friendly_licenses = ['mit', 'apache', 'cc-by', 'cc0', 'public domain']
        if any(fl in license for fl in friendly_licenses):
            score += 10
        elif license:
            score += 5

        # 6. 数据规模适中 (5分)
        size = dataset.get('size', 0)
        if size:
            # 偏好1GB-10GB的数据集
            if 1e9 <= size <= 10e9:
                score += 5
            elif size < 1e9 or size > 100e9:
                score += 2
            else:
                score += 4

        return round(score, 2)

    async def llm_evaluate(self, datasets: List[Dict], requirements: str) -> Dict:
        """使用LLM进行最终决策"""

        # 准备候选列表
        candidates_text = self._format_candidates(datasets)

        prompt = f"""你是一个数据集选择专家。用户需求如下：

**需求描述**：
{requirements}

**候选数据集**：
{candidates_text}

请根据以下标准评估并选择最合适的数据集：

1. **任务匹配度** (40%)：数据集是否符合用户的具体任务需求
2. **数据质量** (25%)：数据规模、标注质量、错误率
3. **可用性** (15%)：文档完整性、使用难度、预处理需求
4. **可信度** (10%)：来源可靠性、社区认可度
5. **许可证** (10%)：是否可商用、使用限制

**输出格式**（JSON）：
{{
    "selected_dataset_id": "平台/数据集ID",
    "platform": "平台名称",
    "confidence": 0.95,
    "reasoning": "详细选择理由（包括匹配的优势和潜在的不足）",
    "alternatives": ["备选1", "备选2"],
    "warnings": ["使用注意事项"]
}}
"""

        response = await self.llm.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        import json
        decision = json.loads(response.choices[0].message.content)
        return decision

    def _format_candidates(self, datasets: List[Dict]) -> str:
        """格式化候选数据集信息"""
        lines = []
        for i, ds in enumerate(datasets, 1):
            score = self.calculate_score(ds)
            lines.append(f"""
### {i}. {ds.get('name')} (评分: {score}/100)
- **平台**: {ds.get('platform', 'Unknown')}
- **ID**: {ds.get('id')}
- **下载量**: {ds.get('downloads', 'N/A'):,}
- **最后更新**: {ds.get('last_modified', 'N/A')}
- **许可证**: {ds.get('license', 'Unknown')}
- **大小**: {self._format_size(ds.get('size'))}
- **描述**: {ds.get('description', 'No description')[:200]}...
- **标签**: {', '.join(ds.get('tags', [])[:5])}
""")
        return '\n'.join(lines)

    @staticmethod
    def _format_size(bytes_size):
        """格式化文件大小"""
        if not bytes_size:
            return "Unknown"
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_size < 1024:
                return f"{bytes_size:.2f} {unit}"
            bytes_size /= 1024
        return f"{bytes_size:.2f} PB"
```

---

## 5. 完整的Autonomous Agent实现

```python
import asyncio
from typing import Dict, List
import logging

class AutonomousDatasetAgent:
    """自主数据集搜索和下载代理"""

    def __init__(self, config: Dict):
        self.hf_searcher = HuggingFaceSearcher(config.get('hf_token'))
        self.ms_searcher = ModelScopeSearcher(config.get('ms_token'))
        self.kaggle_searcher = KaggleSearcher()
        self.evaluator = DatasetEvaluationEngine(config.get('llm_client'))

        self.logger = logging.getLogger(__name__)

    async def find_best_dataset(
        self,
        requirements: str,
        task_type: str = None,
        max_size_gb: float = None
    ) -> Dict:
        """
        根据需求自动找到最佳数据集

        Args:
            requirements: 用户需求描述
            task_type: 任务类型 (text-classification, image-classification等)
            max_size_gb: 最大数据集大小限制

        Returns:
            选择的数据集信息和下载路径
        """

        # Step 1: 并发搜索所有平台
        self.logger.info(f"开始搜索数据集，需求: {requirements}")
        all_results = await self._search_all_platforms(requirements, task_type)

        # Step 2: 预筛选
        filtered = self._pre_filter(all_results, max_size_gb)
        self.logger.info(f"找到 {len(filtered)} 个候选数据集")

        # Step 3: 计算初步评分并排序
        scored = []
        for ds in filtered:
            score = self.evaluator.calculate_score(ds)
            scored.append((ds, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        top_candidates = [ds for ds, score in scored[:10]]

        # Step 4: LLM最终决策
        self.logger.info("使用LLM进行最终评估...")
        decision = await self.evaluator.llm_evaluate(
            top_candidates,
            requirements
        )

        # Step 5: 下载选中的数据集
        selected_id = decision['selected_dataset_id']
        platform = decision['platform']

        self.logger.info(f"选择了 {platform}/{selected_id}")
        self.logger.info(f"理由: {decision['reasoning']}")

        dataset_path = await self._download_dataset(platform, selected_id)

        return {
            'dataset_id': selected_id,
            'platform': platform,
            'path': dataset_path,
            'decision': decision
        }

    async def _search_all_platforms(self, query: str, task: str) -> List[Dict]:
        """并发搜索所有平台"""
        tasks = [
            self._search_platform('huggingface', query, task),
            self._search_platform('modelscope', query, task),
            self._search_platform('kaggle', query, task),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_datasets = []
        for platform_results in results:
            if isinstance(platform_results, Exception):
                self.logger.warning(f"平台搜索失败: {platform_results}")
                continue
            all_datasets.extend(platform_results)

        return all_datasets

    async def _search_platform(self, platform: str, query: str, task: str) -> List[Dict]:
        """搜索单个平台"""
        try:
            if platform == 'huggingface':
                results = await self.hf_searcher.search(query, task)
            elif platform == 'modelscope':
                results = await self.ms_searcher.search(query, task)
            elif platform == 'kaggle':
                results = await self.kaggle_searcher.search(query)
            else:
                return []

            # 添加平台标记
            for r in results:
                r['platform'] = platform

            return results
        except Exception as e:
            self.logger.error(f"{platform} 搜索失败: {e}")
            return []

    def _pre_filter(self, datasets: List[Dict], max_size_gb: float) -> List[Dict]:
        """预筛选：过滤掉明显不合适的数据集"""
        filtered = []

        for ds in datasets:
            # 大小限制
            if max_size_gb:
                size_gb = ds.get('size', 0) / 1e9
                if size_gb > max_size_gb:
                    continue

            # 必须有描述
            if not ds.get('description'):
                continue

            # 必须有下载量或点赞数（排除无人使用的数据集）
            if not (ds.get('downloads') or ds.get('likes') or ds.get('votes')):
                continue

            filtered.append(ds)

        return filtered

    async def _download_dataset(self, platform: str, dataset_id: str) -> str:
        """下载数据集"""
        output_dir = f"./datasets/{platform}/{dataset_id.replace('/', '_')}"

        self.logger.info(f"开始下载 {platform}/{dataset_id} 到 {output_dir}")

        try:
            if platform == 'huggingface':
                path = await self.hf_searcher.download(dataset_id, output_dir)
            elif platform == 'modelscope':
                path = await self.ms_searcher.download(dataset_id, output_dir)
            elif platform == 'kaggle':
                path = await self.kaggle_searcher.download(dataset_id, output_dir)
            else:
                raise ValueError(f"不支持的平台: {platform}")

            self.logger.info(f"下载完成: {path}")
            return path

        except Exception as e:
            self.logger.error(f"下载失败: {e}")
            raise
```

---

## 6. 使用示例

```python
# 配置
config = {
    'hf_token': 'hf_xxx',
    'ms_token': 'ms_xxx',
    'llm_client': AsyncOpenAI(api_key='sk-xxx')
}

# 创建代理
agent = AutonomousDatasetAgent(config)

# 自动搜索和下载
result = await agent.find_best_dataset(
    requirements="""
    我需要一个中文情感分析数据集，用于训练一个电商评论分类模型。
    要求：
    - 包含正面、负面、中性三类标签
    - 数据量在10万条以上
    - 最好是电商或产品评论领域
    - 需要高质量标注
    """,
    task_type="text-classification",
    max_size_gb=5.0
)

print(f"选择的数据集: {result['platform']}/{result['dataset_id']}")
print(f"下载路径: {result['path']}")
print(f"选择理由: {result['decision']['reasoning']}")
```

---

## 7. 性能优化建议

### 7.1 缓存机制
```python
import diskcache as dc

cache = dc.Cache('./dataset_search_cache')

@cache.memoize(expire=3600)  # 缓存1小时
async def search_with_cache(platform, query, task):
    return await searcher.search(query, task)
```

### 7.2 并发控制
```python
import asyncio

semaphore = asyncio.Semaphore(5)  # 最多5个并发请求

async def search_with_limit(platform, query):
    async with semaphore:
        return await search(platform, query)
```

### 7.3 增量更新
```python
# 只搜索最近更新的数据集
last_search_time = load_last_search_time()
datasets = await searcher.search(
    query=query,
    updated_after=last_search_time
)
```

---

## 8. 错误处理和重试

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def search_with_retry(platform, query):
    try:
        return await search(platform, query)
    except RateLimitError:
        # 遇到速率限制，等待后重试
        await asyncio.sleep(60)
        raise
    except NetworkError:
        # 网络错误，重试
        raise
```

---

## 9. 成本估算

| 方案 | 开发成本 | 维护成本 | 运行成本 | 总计 |
|------|---------|---------|---------|------|
| **API方案** | 中 (2周) | 低 | $10-50/月 (LLM调用) | ⭐⭐⭐⭐⭐ |
| **Selenium方案** | 高 (4周) | 高 | $50-200/月 (代理+服务器) | ⭐⭐⭐ |
| **混合方案** | 中高 (3周) | 中 | $20-100/月 | ⭐⭐⭐⭐ |

---

## 10. 推荐方案总结

### ✅ 最终推荐：API优先 + LLM决策

**理由**：
1. **稳定性高**：使用官方SDK，不容易失效
2. **性能好**：API响应快，支持并发
3. **成本低**：无需额外服务器和代理
4. **智能化**：LLM可以理解复杂需求，做出合理决策
5. **可维护**：代码清晰，易于调试和扩展

**实施步骤**：
1. 第一阶段：集成HuggingFace、ModelScope、Kaggle API
2. 第二阶段：实现评分引擎和LLM决策
3. 第三阶段：添加下载和自动导入功能
4. 第四阶段：（可选）为无API平台添加Selenium支持

**时间估算**：2-3周完成核心功能

---

## 附录：依赖包列表

```txt
# API客户端
huggingface-hub>=0.19.0
modelscope>=1.9.0
kaggle>=1.5.16
openxlab>=0.0.9

# LLM
openai>=1.0.0

# 数据处理
datasets>=2.14.0
pandas>=2.0.0

# 异步和并发
asyncio
aiohttp>=3.9.0

# 缓存
diskcache>=5.6.0

# 重试机制
tenacity>=8.2.0

# 日志
loguru>=0.7.0

# Selenium (可选，降级方案)
selenium>=4.15.0
webdriver-manager>=4.0.0
```
