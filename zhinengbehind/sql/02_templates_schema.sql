-- VAST 8.0 模板库与协作编辑扩展 Schema

-- ========== 权利要求书标准模板库 ==========
CREATE TABLE IF NOT EXISTS sys_claims_template (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL COMMENT '模板名称',
    patent_type VARCHAR(30) NOT NULL COMMENT '适用专利类型: 发明专利/实用新型/外观设计',
    tech_field VARCHAR(50) COMMENT '适用技术领域',
    template_type VARCHAR(30) NOT NULL COMMENT '模板类型: 产品/方法/系统/装置/工艺',
    independent_claim_template TEXT NOT NULL COMMENT '独立权利要求模板',
    dependent_claim_templates JSON COMMENT '从属权利要求模板列表',
    preamble_template TEXT COMMENT '前序部分模板',
    character_part_template TEXT COMMENT '特征部分模板',
    example_claims TEXT COMMENT '示例权利要求书',
    usage_guide TEXT COMMENT '使用说明',
    create_user VARCHAR(50) COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patent_type (patent_type),
    INDEX idx_tech_field (tech_field),
    INDEX idx_template_type (template_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权利要求书标准模板库';

-- ========== 交底书标准模板库 ==========
CREATE TABLE IF NOT EXISTS sys_disclosure_template (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL COMMENT '模板名称',
    template_type VARCHAR(30) NOT NULL COMMENT '模板类型: 结构说明/工艺步骤/原理说明/动作关系/综合',
    patent_type VARCHAR(30) COMMENT '适用专利类型',
    tech_field VARCHAR(50) COMMENT '适用技术领域',
    template_content TEXT NOT NULL COMMENT '模板内容',
    required_sections JSON COMMENT '必填章节列表',
    example_content TEXT COMMENT '示例内容',
    create_user VARCHAR(50) COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_type (template_type),
    INDEX idx_patent_type (patent_type),
    INDEX idx_tech_field (tech_field)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交底书标准模板库';

-- ========== 协作编辑文档表 ==========
CREATE TABLE IF NOT EXISTS sys_collaborative_doc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL COMMENT '关联案件',
    doc_type VARCHAR(20) NOT NULL COMMENT '文档类型: spec/claims/five_books',
    doc_content LONGTEXT COMMENT '文档内容',
    version INT DEFAULT 1 COMMENT '版本号',
    active_users INT DEFAULT 0 COMMENT '当前在线用户数',
    max_users INT DEFAULT 30 COMMENT '最大用户数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES sys_case(case_id) ON DELETE CASCADE,
    INDEX idx_case_type (case_id, doc_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='协作编辑文档';

-- ========== 协作编辑操作记录表 ==========
CREATE TABLE IF NOT EXISTS sys_collaborative_operation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doc_id INT NOT NULL COMMENT '关联文档',
    user_id VARCHAR(50) NOT NULL COMMENT '操作用户',
    user_name VARCHAR(50) COMMENT '用户显示名',
    operation_type VARCHAR(20) NOT NULL COMMENT '操作类型: insert/delete/retain',
    position INT NOT NULL COMMENT '操作位置',
    content TEXT COMMENT '插入内容',
    length INT COMMENT '删除长度',
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doc_id) REFERENCES sys_collaborative_doc(id) ON DELETE CASCADE,
    INDEX idx_doc_time (doc_id, operation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='协作编辑操作记录';

-- ========== 插入默认权利要求书模板 ==========
INSERT INTO sys_claims_template (template_name, patent_type, tech_field, template_type, independent_claim_template, dependent_claim_templates, preamble_template, character_part_template, example_claims, usage_guide) VALUES
('产品装置类-发明专利', '发明专利', NULL, '产品', 
'1. 一种[产品名称]，包括[主体部件]，其特征在于，[创新特征描述]。',
'["2. 根据权利要求1所述的[产品名称]，其特征在于，[附加特征1]。","3. 根据权利要求1或2所述的[产品名称]，其特征在于，[附加特征2]。"]',
'一种[产品名称]，包括[主体部件]',
'其特征在于，[创新特征描述]',
'1. 一种智能温控系统，包括温度传感器、控制器和加热器，其特征在于，所述控制器采用变频控制算法，根据温度传感器的实时数据动态调节加热器功率。\n2. 根据权利要求1所述的智能温控系统，其特征在于，所述温度传感器包括多个分布式测温节点。',
'适用于机械、电子等实体产品类发明专利的权利要求书撰写。将[产品名称]替换为实际发明名称，[主体部件]替换为构成产品的核心部件，[创新特征]替换为具体创新点。'
),
('方法工艺类-发明专利', '发明专利', NULL, '方法',
'1. 一种[方法名称]，其特征在于，包括以下步骤：[步骤1]；[步骤2]；[步骤3]。',
'["2. 根据权利要求1所述的[方法名称]，其特征在于，在步骤[编号]中，[附加条件或参数]。","3. 根据权利要求1所述的[方法名称]，其特征在于，还包括步骤[编号]：[附加步骤描述]。"]',
'一种[方法名称]',
'其特征在于，包括以下步骤：[步骤1]；[步骤2]；[步骤3]',
'1. 一种工业缺陷检测方法，其特征在于，包括以下步骤：获取工件表面图像；对图像进行预处理，提取边缘特征；将提取的特征输入训练好的神经网络模型，得到缺陷识别结果；根据识别结果标记缺陷位置。\n2. 根据权利要求1所述的工业缺陷检测方法，其特征在于，所述预处理包括灰度化和噪声滤除。',
'适用于方法、工艺、算法类发明专利的权利要求书撰写。将[方法名称]替换为实际发明名称，[步骤]替换为具体执行步骤。'
),
('系统架构类-发明专利', '发明专利', NULL, '系统',
'1. 一种[系统名称]，包括[模块A]、[模块B]和[模块C]，其特征在于，[模块A]与[模块B]通过[连接方式]连接，[模块C]用于[功能描述]。',
'["2. 根据权利要求1所述的[系统名称]，其特征在于，所述[模块A]包括[子模块]和[子模块]。","3. 根据权利要求1所述的[系统名称]，其特征在于，还包括[模块D]，用于[附加功能]。"]',
'一种[系统名称]，包括[模块A]、[模块B]和[模块C]',
'其特征在于，[模块A]与[模块B]通过[连接方式]连接，[模块C]用于[功能描述]',
'1. 一种智能物流调度系统，包括订单管理模块、路径规划模块和车辆调度模块，其特征在于，所述订单管理模块与路径规划模块通过API接口连接，所述车辆调度模块用于根据规划路径分配配送车辆。\n2. 根据权利要求1所述的智能物流调度系统，其特征在于，所述路径规划模块包括实时路况分析子模块和最优路径计算子模块。',
'适用于系统、平台、架构类发明专利的权利要求书撰写。'
),
('实用新型-产品结构', '实用新型', NULL, '产品',
'1. 一种[产品名称]，包括[部件1]和[部件2]，其特征在于，[部件1]与[部件2]通过[连接结构]连接，[创新结构特征]。',
'["2. 根据权利要求1所述的[产品名称]，其特征在于，所述[部件1]上设置有[附加结构]。","3. 根据权利要求1所述的[产品名称]，其特征在于，所述[连接结构]为[具体结构形式]。"]',
'一种[产品名称]，包括[部件1]和[部件2]',
'其特征在于，[部件1]与[部件2]通过[连接结构]连接，[创新结构特征]',
'1. 一种环保塑料模具，包括模体和冷却流道，其特征在于，所述模体与冷却流道为一体注塑成型结构，冷却流道呈螺旋状环绕模体外壁。\n2. 根据权利要求1所述的环保塑料模具，其特征在于，所述模体上设置有多个定位孔。',
'适用于实用新型专利，强调产品结构和形状特征。'
),
('组合物/材料类-发明专利', '发明专利', NULL, '产品',
'1. 一种[组合物名称]，其特征在于，按重量份包括：[组分A] [数量]份、[组分B] [数量]份、[组分C] [数量]份。',
'["2. 根据权利要求1所述的[组合物名称]，其特征在于，还包括[附加组分] [数量]份。","3. 根据权利要求1所述的[组合物名称]，其特征在于，所述[组分A]的[粒径/纯度/形态]为[具体参数]。"]',
'一种[组合物名称]',
'其特征在于，按重量份包括：[组分A] [数量]份、[组分B] [数量]份、[组分C] [数量]份',
'1. 一种耐高温改性塑料，其特征在于，按重量份包括：聚酰亚胺树脂60份、玻璃纤维25份、纳米二氧化硅10份和相容剂5份。\n2. 根据权利要求1所述的耐高温改性塑料，其特征在于，还包括阻燃剂3-5份。',
'适用于化学、材料类发明专利。'
);

-- ========== 插入默认交底书模板 ==========
INSERT INTO sys_disclosure_template (template_name, template_type, patent_type, tech_field, template_content, required_sections, example_content) VALUES
('结构说明模板', '结构说明', NULL, NULL,
'## 技术领域\n[填写本发明所属的技术领域]\n\n## 背景技术\n[描述现有技术状况及存在的问题]\n\n## 发明内容\n\n### 产品结构\n本发明提供一种[产品名称]，包括以下组成部分：\n\n1. **主体部件**：[描述主体部件的结构、材质、尺寸等]\n2. **连接部件**：[描述各部件之间的连接方式、位置关系]\n3. **辅助部件**：[描述辅助部件的功能和设置位置]\n\n### 各部件详细说明\n- [部件1]：包括[子部件]，设置为[位置/方向]，用于[功能]\n- [部件2]：与[部件1]通过[连接方式]连接，实现[功能]\n\n### 整体结构特征\n[描述整体结构的创新点和优势]\n\n## 附图说明\n图1为本发明的整体结构示意图；\n图2为[部件]的局部放大图；\n图3为[连接方式]的剖面图。',
'["技术领域","背景技术","产品结构","各部件详细说明","附图说明"]',
'技术领域：本发明涉及智能家居技术领域，尤其涉及一种智能温控系统。\n\n背景技术：现有温控系统通常采用固定功率加热，存在温度波动大、能耗高等问题。\n\n产品结构：本发明提供一种智能温控系统，包括温度传感器、控制器和加热器。\n\n各部件详细说明：温度传感器包括多个分布式测温节点，均匀布置在加热区域；控制器采用变频控制芯片，接收传感器数据并输出控制信号；加热器为PTC陶瓷加热体，根据控制信号调节功率。'
),
('工艺步骤模板', '工艺步骤', NULL, NULL,
'## 技术领域\n[填写本发明所属的技术领域]\n\n## 背景技术\n[描述现有工艺方法及存在的问题]\n\n## 发明内容\n\n### 方法概述\n本发明提供一种[方法名称]，包括以下步骤：\n\n### 详细步骤\n\n**步骤1：[步骤名称]**\n- 操作内容：[详细描述操作内容]\n- 工艺参数：[温度/压力/时间/配比等参数]\n- 设备要求：[所需设备及其规格]\n\n**步骤2：[步骤名称]**\n- 操作内容：[详细描述操作内容]\n- 工艺参数：[温度/压力/时间/配比等参数]\n- 注意事项：[关键控制点和质量要求]\n\n**步骤3：[步骤名称]**\n- 操作内容：[详细描述操作内容]\n- 质量检验：[检验标准和方法]\n\n### 工艺流程图\n[描述工艺流程顺序和分支条件]\n\n## 效果说明\n[描述采用本工艺方法带来的效果]',
'["技术领域","背景技术","方法概述","详细步骤","工艺流程图"]',
'技术领域：本发明涉及工业制造领域，尤其涉及一种精密零件加工工艺。\n\n背景技术：现有加工工艺存在效率低、精度差等问题。\n\n方法概述：本发明提供一种精密零件加工工艺，包括预处理、粗加工、精加工和质检四个步骤。\n\n详细步骤：步骤1：预处理，将毛坯件进行去毛刺和清洗，工艺参数为超声波清洗15分钟；步骤2：粗加工，使用CNC机床进行轮廓加工，工艺参数为切削速度120m/min；步骤3：精加工，采用磨削工艺，工艺参数为进给量0.01mm/转。'
),
('原理说明模板', '原理说明', NULL, NULL,
'## 技术领域\n[填写本发明所属的技术领域]\n\n## 背景技术\n[描述现有技术原理及局限性]\n\n## 发明内容\n\n### 技术原理\n本发明基于[原理名称]原理，通过[核心机制]实现[技术效果]。\n\n### 原理详细说明\n\n**基本原理：**\n[描述所依据的科学原理或自然规律]\n\n**技术实现：**\n- 输入：[系统输入的信号/数据/能量]\n- 处理：[核心处理过程，包括数学模型或物理模型]\n- 输出：[系统输出的结果]\n\n**关键公式：**\n[列出关键计算公式或关系式]\n\n### 工作机制\n1. [初始状态]：系统初始处于[状态描述]\n2. [触发条件]：当[条件]时，[组件]开始[动作]\n3. [处理过程]：通过[机制]将[输入]转化为[输出]\n4. [稳定状态]：最终达到[稳定状态描述]\n\n## 效果说明\n[描述技术原理带来的优势效果]',
'["技术领域","背景技术","技术原理","原理详细说明","工作机制"]',
'技术领域：本发明涉及信号处理领域，尤其涉及一种自适应滤波方法。\n\n背景技术：现有滤波方法在噪声环境变化时效果下降。\n\n技术原理：本发明基于最小均方误差（LMS）自适应算法，通过实时调整滤波系数实现最优滤波。\n\n原理详细说明：基本原理是根据输入信号和期望信号的误差，迭代更新滤波器权重；技术实现包括信号采集模块、误差计算模块和权重更新模块。'
),
('动作关系模板', '动作关系', NULL, NULL,
'## 技术领域\n[填写本发明所属的技术领域]\n\n## 背景技术\n[描述现有技术中动作配合存在的问题]\n\n## 发明内容\n\n### 动作关系概述\n本发明提供一种[系统/装置名称]，其中各部件的动作关系如下：\n\n### 动作时序\n\n**第一动作：[动作名称]**\n- 执行部件：[执行该动作的部件]\n- 触发条件：[触发该动作的条件]\n- 动作内容：[详细描述动作过程]\n- 动作结果：[动作完成后的状态]\n\n**第二动作：[动作名称]**\n- 执行部件：[执行该动作的部件]\n- 触发条件：[触发条件，通常与第一动作的结果相关]\n- 动作内容：[详细描述动作过程]\n- 动作结果：[动作完成后的状态]\n\n**第三动作：[动作名称]**\n- 执行部件：[执行该动作的部件]\n- 动作内容：[详细描述动作过程]\n\n### 动作配合关系\n- [部件A]与[部件B]的联动关系：[描述联动方式]\n- [部件C]的反馈控制：[描述反馈机制]\n- 异常处理：[描述异常情况下的动作处理]\n\n## 效果说明\n[描述动作关系优化带来的效果]',
'["技术领域","背景技术","动作关系概述","动作时序","动作配合关系"]',
'技术领域：本发明涉及机械自动化领域，尤其涉及一种多轴联动机械手。\n\n背景技术：现有机械手各轴动作协调差，效率低。\n\n动作关系概述：本发明提供一种多轴联动机械手，各轴动作协调配合。\n\n动作时序：第一动作：基座旋转，执行部件为旋转电机，触发条件为接收目标位置信号，动作内容为旋转至目标角度；第二动作：大臂升降，执行部件为升降液压缸，触发条件为基座旋转到位后，动作内容为升降至目标高度；第三动作：小臂伸缩，执行部件为伸缩电机，动作内容为伸缩至目标位置。'
),
('综合模板', '综合', NULL, NULL,
'## 技术领域\n[填写本发明所属的技术领域]\n\n## 背景技术\n[描述现有技术状况、存在的问题和不足]\n\n## 发明目的\n[本发明要解决的技术问题和预期目标]\n\n## 技术方案\n\n### 整体方案\n[概述技术方案的整体思路]\n\n### 结构说明\n[详细描述各组成部分的结构特征]\n\n### 工艺步骤/方法流程\n[如果是产品：描述制造或使用方法；如果是方法：描述具体步骤]\n\n### 工作原理\n[描述技术方案的工作原理和理论基础]\n\n### 动作关系/配合关系\n[描述各部件之间的动作配合或信号交互关系]\n\n## 有益效果\n[与现有技术相比，本发明带来的技术效果]\n\n## 附图说明\n[列出各附图及其说明]\n\n## 具体实施方式\n[提供至少一个具体实施例，详细说明如何实施本发明]',
'["技术领域","背景技术","发明目的","技术方案","有益效果"]',
'技术领域：本发明涉及智能制造领域。\n\n背景技术：现有生产线自动化程度低，人工干预多。\n\n发明目的：提供一种全自动化智能生产线，提高生产效率。\n\n技术方案：包括输送系统、加工系统、检测系统和控制系统。\n\n有益效果：生产效率提高50%，不良率降低至1%以下。'
);
