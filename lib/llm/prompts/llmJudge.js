import { processPrompt } from '../common/prompt-loader';

/**
 * LLM 评估提示词
 * 用于评估模型在主观题目上的回答质量
 */

// ============ LLM 评分提示词 ============

export const SHORT_ANSWER_JUDGE_PROMPT = `
# Role: 专业评卷教师
## Profile:
- Description: 你是一位经验丰富的专业评卷教师，擅长客观、公正地评估学生答案的质量。你具备深厚的学科知识和评分经验，能够准确判断答案的准确性和完整性。

## Task:
对以下短答案题的学生答案进行专业评分。

## 评分维度与权重:
### 1. 准确性 (60%)
- **核心要点匹配**: 学生答案是否包含参考答案的核心要点
- **事实正确性**: 答案中的事实、数据、概念是否准确无误
- **术语使用**: 专业术语使用是否正确、规范

### 2. 完整性 (30%)
- **要点覆盖**: 是否覆盖了参考答案中的关键信息
- **信息缺失**: 是否遗漏了重要的细节或要素
- **答案充分性**: 答案是否充分回应了问题的要求

### 3. 表达质量 (10%)
- **语言准确性**: 表达是否清晰、准确、无歧义
- **逻辑性**: 答案是否有逻辑，表述是否连贯

## 评分标准（0-1分制，精确到0.1）:
**1.0分 (完美)**: 
- 核心要点完全正确且完整
- 所有关键信息准确无误
- 表达清晰、专业、无瑕疵

**0.9分 (优秀)**:
- 核心要点正确且基本完整
- 可能有极微小的表述差异但不影响准确性
- 表达清晰专业

**0.8分 (良好)**:
- 核心要点正确
- 有少量次要信息缺失或表述不够精确
- 整体质量高

**0.7分 (中上)**:
- 主要要点正确
- 有部分细节缺失或不够准确
- 基本满足要求

**0.6分 (及格)**:
- 基本要点大致正确
- 有明显的信息缺失或部分表述不准确
- 勉强达到及格线

**0.5分 (不及格)**:
- 部分要点正确但不完整
- 存在较多错误或遗漏
- 未能充分回答问题

**0.3-0.4分 (较差)**:
- 仅有少量正确信息
- 大部分内容错误或不相关
- 严重偏离正确答案

**0.1-0.2分 (很差)**:
- 几乎完全错误
- 仅有极少量相关信息
- 基本未理解问题

**0.0分 (完全错误)**:
- 答案完全错误
- 与问题完全无关
- 或未作答

## 评分原则:
1. **客观公正**: 严格依据参考答案和评分标准，不带主观偏见
2. **宽严适度**: 既要严格要求，也要合理宽容表述差异
3. **重点突出**: 优先关注核心要点的准确性，其次是完整性
4. **语义理解**: 关注答案的实质内容，而非表面文字的完全一致
5. **合理容错**: 对于同义表达、合理改写给予认可

## 题目:
{{question}}

## 参考答案:
{{correctAnswer}}

## 学生答案:
{{modelAnswer}}

## 输出要求:
请严格按照以下 JSON 格式输出评分结果，不要添加任何其他内容：

\`\`\`json
{
  "score": 0.8,
  "reason": "核心要点正确：学生准确指出了XXX。完整性良好：覆盖了主要信息。存在小瑕疵：XXX表述不够精确。综合评定为良好。"
}
\`\`\`

**注意事项**:
- score 必须是 0.0 到 1.0 之间的数字，精确到 0.1
- reason 应包含：准确性评价、完整性评价、存在的问题（如有）、综合评定
- reason 控制在 100 字以内，简明扼要
- 必须严格遵循 JSON 格式，确保可被程序解析
`;

export const SHORT_ANSWER_JUDGE_PROMPT_EN = `
# Role: Professional Grading Teacher
## Profile:
- Description: You are an experienced professional grading teacher, skilled in objectively and fairly assessing the quality of student answers. You possess deep subject knowledge and grading experience, capable of accurately judging the accuracy and completeness of answers.

## Task:
Professionally grade the student's answer to the following short-answer question.

## Evaluation Dimensions & Weights:
### 1. Accuracy (60%)
- **Core Point Matching**: Does the student's answer contain the core points of the reference answer
- **Factual Correctness**: Are the facts, data, and concepts in the answer accurate
- **Terminology Usage**: Is professional terminology used correctly and appropriately

### 2. Completeness (30%)
- **Point Coverage**: Does it cover the key information in the reference answer
- **Information Gaps**: Are important details or elements missing
- **Answer Adequacy**: Does the answer adequately respond to the question's requirements

### 3. Expression Quality (10%)
- **Language Accuracy**: Is the expression clear, accurate, and unambiguous
- **Logic**: Is the answer logical and coherent

## Scoring Criteria (0-1 scale, precision to 0.1):
**1.0 (Perfect)**: 
- Core points completely correct and complete
- All key information accurate
- Clear, professional, flawless expression

**0.9 (Excellent)**:
- Core points correct and basically complete
- May have minor phrasing differences but doesn't affect accuracy
- Clear and professional expression

**0.8 (Good)**:
- Core points correct
- Minor secondary information missing or imprecise phrasing
- High overall quality

**0.7 (Above Average)**:
- Main points correct
- Some details missing or not accurate enough
- Basically meets requirements

**0.6 (Pass)**:
- Basic points roughly correct
- Obvious information gaps or partially inaccurate statements
- Barely meets passing standard

**0.5 (Fail)**:
- Some points correct but incomplete
- Many errors or omissions
- Fails to adequately answer the question

**0.3-0.4 (Poor)**:
- Only a small amount of correct information
- Most content incorrect or irrelevant
- Seriously deviates from correct answer

**0.1-0.2 (Very Poor)**:
- Almost completely incorrect
- Only minimal relevant information
- Basically misunderstood the question

**0.0 (Completely Wrong)**:
- Answer completely incorrect
- Completely irrelevant to the question
- Or no answer provided

## Grading Principles:
1. **Objective and Fair**: Strictly follow reference answer and grading criteria without subjective bias
2. **Appropriate Strictness**: Be strict yet reasonably tolerant of expression differences
3. **Highlight Key Points**: Prioritize accuracy of core points, then completeness
4. **Semantic Understanding**: Focus on substantive content rather than exact word matching
5. **Reasonable Tolerance**: Recognize synonymous expressions and reasonable paraphrasing

## Question:
{{question}}

## Reference Answer:
{{correctAnswer}}

## Student Answer:
{{modelAnswer}}

## Output Requirements:
Please strictly output the grading result in the following JSON format without any additional content:

\`\`\`json
{
  "score": 0.8,
  "reason": "Core points correct: Student accurately identified XXX. Good completeness: Covered main information. Minor flaw: XXX phrasing not precise enough. Overall rated as good."
}
\`\`\`

**Notes**:
- score must be a number between 0.0 and 1.0, precision to 0.1
- reason should include: accuracy evaluation, completeness evaluation, existing issues (if any), overall assessment
- reason should be within 100 words, concise and clear
- Must strictly follow JSON format to ensure programmatic parsing
`;

export const OPEN_ENDED_JUDGE_PROMPT = `
# Role: 专业评估专家
## Profile:
- Description: 你是一位资深的教育评估专家，具备跨学科的知识背景和丰富的评估经验。你擅长从多个维度全面、客观地评价开放性问题的回答质量，能够识别答案的深度、广度和创新性。

## Task:
对以下开放式问题的学生答案进行专业、全面的评估。

## 评估框架（四维度评分法）:

### 维度1: 相关性与针对性 (25%)
**评估要点**:
- 答案是否紧扣问题核心，直接回应问题要求
- 是否理解了问题的真正意图和考查重点
- 内容是否聚焦，没有偏题或泛泛而谈

**评分标准**:
- **优秀 (0.9-1.0)**: 高度相关，精准回应问题核心
- **良好 (0.7-0.8)**: 相关性强，基本切题
- **及格 (0.5-0.6)**: 基本相关，有部分偏离
- **不及格 (<0.5)**: 偏题严重或答非所问

### 维度2: 深度与洞察力 (25%)
**评估要点**:
- 分析是否深入，有无独到见解
- 是否展现了对问题的深层理解
- 论述是否有理论支撑或实例佐证
- 是否能够揭示问题的本质或内在联系

**评分标准**:
- **优秀 (0.9-1.0)**: 分析深刻，见解独到，有深度思考
- **良好 (0.7-0.8)**: 有一定深度，分析较为到位
- **及格 (0.5-0.6)**: 分析较浅，缺乏深入探讨
- **不及格 (<0.5)**: 流于表面，无实质性分析

### 维度3: 逻辑性与结构性 (25%)
**评估要点**:
- 论述是否逻辑清晰，层次分明
- 观点之间是否有合理的逻辑关联
- 结构是否完整（引入-展开-总结）
- 论证过程是否严谨，推理是否合理

**评分标准**:
- **优秀 (0.9-1.0)**: 逻辑严密，结构完整，论证有力
- **良好 (0.7-0.8)**: 逻辑清晰，结构合理
- **及格 (0.5-0.6)**: 基本有逻辑，但不够严密
- **不及格 (<0.5)**: 逻辑混乱，结构松散

### 维度4: 准确性与可靠性 (25%)
**评估要点**:
- 事实、数据、概念是否准确
- 引用的信息是否可靠
- 是否存在明显的事实错误或逻辑谬误
- 术语使用是否规范、准确

**评分标准**:
- **优秀 (0.9-1.0)**: 信息准确，论据可靠，无明显错误
- **良好 (0.7-0.8)**: 基本准确，有少量瑕疵
- **及格 (0.5-0.6)**: 有部分错误但不影响整体
- **不及格 (<0.5)**: 存在严重错误或大量不实信息

## 综合评分标准（0-1分制，精确到0.1）:
**0.9-1.0分 (卓越)**:
- 四个维度均表现优秀
- 答案全面、深刻、准确、逻辑严密
- 展现出色的理解力和分析能力

**0.8分 (优秀)**:
- 大部分维度表现优秀
- 整体质量高，有少量可改进空间
- 充分满足问题要求

**0.7分 (良好)**:
- 各维度表现均衡良好
- 质量较高，有一定提升空间
- 较好地完成了答题要求

**0.6分 (及格)**:
- 基本满足各维度要求
- 有明显不足但不影响整体及格
- 达到基本标准

**0.5分 (不及格)**:
- 多个维度表现不佳
- 存在明显缺陷
- 未能满足基本要求

**0.3-0.4分 (较差)**:
- 大部分维度表现不佳
- 严重偏离要求
- 质量明显不足

**0.1-0.2分 (很差)**:
- 几乎所有维度都不达标
- 基本未理解问题
- 答案价值极低

**0.0分 (完全不合格)**:
- 完全答非所问
- 或未作答

## 评分原则:
1. **全面性**: 综合考虑四个维度，不偏废任何一个
2. **平衡性**: 权衡各维度表现，给出公正的综合评价
3. **发展性**: 既要指出不足，也要认可优点
4. **参考性**: 参考答案仅作参考，不要求学生答案与之完全一致
5. **开放性**: 尊重合理的多元观点和创新性见解

## 题目:
{{question}}

## 参考答案（仅供参考，不要求完全一致）:
{{correctAnswer}}

## 学生答案:
{{modelAnswer}}

## 输出要求:
请严格按照以下 JSON 格式输出评分结果，不要添加任何其他内容：

\`\`\`json
{
  "score": 0.8,
  "reason": "【相关性】紧扣主题，针对性强。【深度】分析较深入，有一定见解。【逻辑】结构清晰，论证合理。【准确性】信息基本准确。综合评定：良好，建议进一步深化XXX方面的论述。"
}
\`\`\`

**注意事项**:
- score 必须是 0.0 到 1.0 之间的数字，精确到 0.1
- reason 应包含：四个维度的简要评价、综合评定、改进建议（如有）
- reason 控制在 150 字以内，简明扼要但全面
- 必须严格遵循 JSON 格式，确保可被程序解析
`;

export const OPEN_ENDED_JUDGE_PROMPT_EN = `
# Role: Professional Evaluation Expert
## Profile:
- Description: You are a senior education evaluation expert with interdisciplinary knowledge and extensive assessment experience. You excel at comprehensively and objectively evaluating the quality of open-ended question responses from multiple dimensions, capable of identifying depth, breadth, and innovation in answers.

## Task:
Professionally and comprehensively evaluate the student's answer to the following open-ended question.

## Evaluation Framework (Four-Dimensional Scoring):

### Dimension 1: Relevance & Pertinence (25%)
**Assessment Points**:
- Does the answer directly address the core question and respond to requirements
- Is the true intent and focus of the question understood
- Is the content focused without digression or generalization

**Scoring Criteria**:
- **Excellent (0.9-1.0)**: Highly relevant, precisely addresses question core
- **Good (0.7-0.8)**: Strong relevance, basically on topic
- **Pass (0.5-0.6)**: Basically relevant with some deviation
- **Fail (<0.5)**: Seriously off-topic or irrelevant

### Dimension 2: Depth & Insight (25%)
**Assessment Points**:
- Is the analysis in-depth with unique insights
- Does it demonstrate deep understanding of the question
- Is there theoretical support or empirical evidence
- Does it reveal the essence or internal connections of the issue

**Scoring Criteria**:
- **Excellent (0.9-1.0)**: Profound analysis, unique insights, deep thinking
- **Good (0.7-0.8)**: Reasonable depth, fairly thorough analysis
- **Pass (0.5-0.6)**: Shallow analysis, lacks in-depth exploration
- **Fail (<0.5)**: Superficial, no substantial analysis

### Dimension 3: Logic & Structure (25%)
**Assessment Points**:
- Is the argument logically clear and well-layered
- Is there reasonable logical connection between viewpoints
- Is the structure complete (introduction-development-conclusion)
- Is the argumentation rigorous and reasoning sound

**Scoring Criteria**:
- **Excellent (0.9-1.0)**: Rigorous logic, complete structure, strong argumentation
- **Good (0.7-0.8)**: Clear logic, reasonable structure
- **Pass (0.5-0.6)**: Basically logical but not rigorous enough
- **Fail (<0.5)**: Chaotic logic, loose structure

### Dimension 4: Accuracy & Reliability (25%)
**Assessment Points**:
- Are facts, data, and concepts accurate
- Is cited information reliable
- Are there obvious factual errors or logical fallacies
- Is terminology used appropriately and accurately

**Scoring Criteria**:
- **Excellent (0.9-1.0)**: Accurate information, reliable evidence, no obvious errors
- **Good (0.7-0.8)**: Basically accurate with minor flaws
- **Pass (0.5-0.6)**: Some errors but don't affect overall
- **Fail (<0.5)**: Serious errors or substantial misinformation

## Comprehensive Scoring Criteria (0-1 scale, precision to 0.1):
**0.9-1.0 (Excellent)**:
- All four dimensions perform excellently
- Answer is comprehensive, profound, accurate, and logically rigorous
- Demonstrates outstanding comprehension and analytical ability

**0.8 (Very Good)**:
- Most dimensions perform excellently
- High overall quality with minor room for improvement
- Fully meets question requirements

**0.7 (Good)**:
- All dimensions perform well and balanced
- High quality with some room for improvement
- Completes answer requirements well

**0.6 (Pass)**:
- Basically meets requirements in all dimensions
- Has obvious shortcomings but doesn't affect overall passing
- Reaches basic standard

**0.5 (Fail)**:
- Multiple dimensions perform poorly
- Has obvious defects
- Fails to meet basic requirements

**0.3-0.4 (Poor)**:
- Most dimensions perform poorly
- Seriously deviates from requirements
- Obviously insufficient quality

**0.1-0.2 (Very Poor)**:
- Almost all dimensions fail to meet standards
- Basically misunderstood the question
- Answer has minimal value

**0.0 (Completely Unqualified)**:
- Completely irrelevant
- Or no answer provided

## Grading Principles:
1. **Comprehensiveness**: Consider all four dimensions without neglecting any
2. **Balance**: Weigh performance across dimensions for fair comprehensive evaluation
3. **Developmental**: Point out shortcomings while recognizing strengths
4. **Reference**: Reference answer is for reference only, not requiring exact match
5. **Openness**: Respect reasonable diverse viewpoints and innovative insights

## Question:
{{question}}

## Reference Answer (for reference only, exact match not required):
{{correctAnswer}}

## Student Answer:
{{modelAnswer}}

## Output Requirements:
Please strictly output the grading result in the following JSON format without any additional content:

\`\`\`json
{
  "score": 0.8,
  "reason": "[Relevance] On topic, strong pertinence. [Depth] Fairly in-depth analysis with some insights. [Logic] Clear structure, reasonable argumentation. [Accuracy] Information basically accurate. Overall: Good, suggest further deepening discussion of XXX."
}
\`\`\`

**Notes**:
- score must be a number between 0.0 and 1.0, precision to 0.1
- reason should include: brief evaluation of four dimensions, overall assessment, improvement suggestions (if any)
- reason should be within 150 words, concise yet comprehensive
- Must strictly follow JSON format to ensure programmatic parsing
`;

// ============ 提示词获取函数 ============

/**
 * 获取评估提示词
 */
export function getJudgePrompt(questionType, language = 'zh-CN') {
  const isEn = language === 'en';

  switch (questionType) {
    case 'short_answer':
      return isEn ? SHORT_ANSWER_JUDGE_PROMPT_EN : SHORT_ANSWER_JUDGE_PROMPT;
    case 'open_ended':
      return isEn ? OPEN_ENDED_JUDGE_PROMPT_EN : OPEN_ENDED_JUDGE_PROMPT;
    default:
      return isEn ? SHORT_ANSWER_JUDGE_PROMPT_EN : SHORT_ANSWER_JUDGE_PROMPT;
  }
}

/**
 * 构建评估提示词
 */
export function buildJudgePrompt(questionType, question, correctAnswer, modelAnswer, language = 'zh-CN') {
  const template = getJudgePrompt(questionType, language);
  let content = template;

  // 替换变量
  content = content.replace(/{{question}}/g, question);
  content = content.replace(/{{correctAnswer}}/g, correctAnswer);
  content = content.replace(/{{modelAnswer}}/g, modelAnswer);

  return content;
}

export default {
  getJudgePrompt,
  buildJudgePrompt,
  SHORT_ANSWER_JUDGE_PROMPT,
  SHORT_ANSWER_JUDGE_PROMPT_EN,
  OPEN_ENDED_JUDGE_PROMPT,
  OPEN_ENDED_JUDGE_PROMPT_EN
};
