# 客户端模型路由管理说明

## 1. 适用对象

本文档面向系统管理员、运维管理员、平台治理人员。

适用场景：

- 需要统一治理 Claude 客户端、Codex 客户端发来的模型名
- 需要把下游“客户端模型名”转换成上游真实可用模型
- 需要同时兼容两类请求方式：
  - 直接指定上游真实模型
  - 使用客户端自己的模型名称或展示名称
- 需要通过页面或 `config.json` 持续调整模型映射，而不是改代码

---

## 2. 这套机制解决什么问题

不同客户端对同一个能力的模型命名方式不一致。

典型例子：

- Claude 客户端可能发：
  - `default`
  - `Sonnet (1M context)`
  - `Opus`
  - `Haiku`
- Codex 客户端可能发：
  - `gpt-5.3-codex (default)`
  - `gpt-5.4 (current)`
- 但上游供应商真正支持的可能是：
  - `gpt-5.4`
  - `gemini-3.1-pro-preview`
  - `claude-sonnet-4-5`
  - `claude-opus-4-6`
  - `gemini-claude-sonnet-4-6`
  - `grok-4.20`

如果不做治理，常见问题有：

- 选池阶段找不到支持的节点
- 请求发到上游时模型名不被识别
- Claude/Codex 客户端显示模型名与实际上游模型不一致
- `-1M`、`(current)`、`(default)` 等展示名称无法兼容

本次新增的 `clientModelRoutingRules` 就是为了解决这类问题。

---

## 3. 管理员需要区分的 3 套机制

这一部分最重要。

### 3.1 `clientModelRoutingRules`

用途：在请求刚进入系统时，先把“客户端模型名”转换成“系统内部可识别的标准模型名”，并在真正发上游前，再映射成该上游应该用的真实模型。

它解决的是：

- 客户端名称兼容
- 上游真实模型适配
- 选池前的一致化

它是“预路由”。

### 3.2 `providerFallbackChain`

用途：当前主提供商没有可用节点时，按提供商类型切到下一个兼容提供商。

它解决的是：

- 节点不可用
- 同协议/兼容协议之间的提供商级回退

它是“提供商级回退”。

### 3.3 `modelFallbackMapping`

用途：当某个请求模型需要跨协议或跨提供商做兜底时，直接指定“目标提供商 + 目标模型”。

它解决的是：

- 特定模型跨协议兜底
- 特定模型强制改走另一路供应商

它是“模型级回退”。

### 3.4 三者的关系

执行顺序上，通常可以理解为：

1. 先走 `clientModelRoutingRules`
2. 再做节点选择
3. 节点不满足时再考虑 `providerFallbackChain`
4. 需要跨模型强制切换时再考虑 `modelFallbackMapping`

结论：

- `clientModelRoutingRules` 不是 fallback
- `providerFallbackChain` 不是模型别名表
- `modelFallbackMapping` 不是客户端模型兼容表

不要混用。

---

## 4. 配置入口

### 4.1 页面入口

管理后台：

- `配置管理`
- `服务治理`
- `客户端模型路由表 (JSON)`

页面字段说明：

- 字段名：`clientModelRoutingRules`
- 类型：JSON
- 留空：表示不额外覆盖，系统使用默认内置规则

### 4.2 文件入口

主配置文件：

- `configs/config.json`

新增配置项：

```json
{
  "clientModelRoutingRules": {}
}
```

说明：

- 配置为 `{}` 时，表示完全使用系统默认路由表
- 如果只想覆盖某一小部分，只需要写要覆盖的字段
- 对象按层合并
- 数组按整段替换

也就是说：

- 改一个对象子项，不影响其他对象子项
- 改一个数组时，会用你写的数组完整替换默认数组

---

## 5. 路由规则结构说明

`clientModelRoutingRules` 的结构分为 4 个部分。

## 5.1 `protocolModelAliases`

用途：把下游协议层收到的模型名先归一化。

当前支持：

- `claude`
- `openai`

示例：

```json
{
  "protocolModelAliases": {
    "claude": {
      "claude-sonnet-4-6": [
        "default",
        "default (recommended)",
        "sonnet",
        "sonnet (1m context)",
        "sonnet-1m",
        "sonnet 1m"
      ]
    },
    "openai": {
      "gpt-5.4": [
        "gpt-5.4",
        "gpt-5.4 (current)"
      ]
    }
  }
}
```

作用：

- Claude 协议请求中的 `default` 会先变成 `claude-sonnet-4-6`
- OpenAI/Codex 协议请求中的 `gpt-5.4 (current)` 会先变成 `gpt-5.4`

---

## 5.2 `providerModelAliases`

用途：在面向上游供应商做模型兼容判断时，再做一层模型名归一化。

这一层主要用于：

- Claude 家族模型别名归一
- `-1M`
- `thinking`
- `gemini-claude-*`

示例：

```json
{
  "providerModelAliases": {
    "claude": {
      "claude-opus-4-6": [
        "claude-opus-4.6",
        "claude-opus-4-6-thinking",
        "opus (1m context)"
      ]
    }
  }
}
```

---

## 5.3 `providerTargets`

用途：定义不同上游家族最终应该落到哪个真实模型。

这是管理员最常调整的一部分。

当前默认包含：

- `openaiCompatible`
- `geminiCli`
- `kiro`
- `grokCompatible`
- `antigravity`
- `codexToClaude`

说明如下。

### 5.3.1 `openaiCompatible`

当下游请求是 Claude 家族模型，但上游是 OpenAI 兼容接口时，最终落到哪个模型。

默认：

```json
{
  "openaiCompatible": {
    "defaultModel": "gpt-5.4"
  }
}
```

这意味着：

- Claude 客户端请求打到 `openai-custom`
- Claude 客户端请求打到 `openaiResponses-custom`
- Claude 家族模型会被改写成 `gpt-5.4`

### 5.3.2 `geminiCli`

当 Claude 客户端模型或 Codex 客户端模型需要走 Gemini CLI 上游时，默认落到哪个 Gemini 模型。

默认：

```json
{
  "geminiCli": {
    "defaultModel": "gemini-3.1-pro-preview"
  }
}
```

### 5.3.3 `kiro`

Kiro 上游默认是 Claude 家族。

默认：

```json
{
  "kiro": {
    "defaultModel": "claude-sonnet-4-5",
    "haikuModel": "claude-haiku-4-5"
  }
}
```

规则：

- Claude/Codex 普通请求：默认走 `claude-sonnet-4-5`
- 如果请求明确是 Haiku：走 `claude-haiku-4-5`

### 5.3.4 `grokCompatible`

当 Claude/Codex 请求落到 Grok 上游时默认使用哪个 Grok 模型。

默认：

```json
{
  "grokCompatible": {
    "defaultModel": "grok-4.20"
  }
}
```

### 5.3.5 `antigravity`

Antigravity 对 Claude 家族模型有自己的内部模型名。

默认：

```json
{
  "antigravity": {
    "sonnetModel": "claude-sonnet-4-6",
    "opusModel": "claude-opus-4-6"
  }
}
```

这两个标准模型名最终会再通过 `antigravityAliases` 变成内部名。

### 5.3.6 `codexToClaude`

当下游是 Codex 客户端，但上游是 Claude 兼容提供商时，如何把 Codex 模型映射成 Claude 家族模型。

默认：

```json
{
  "codexToClaude": {
    "highCapabilityModel": "gpt-5.4",
    "supportedClientModels": [
      "gpt-5.3-codex",
      "gpt-5.4"
    ],
    "highCapabilityPreferredModels": [
      "claude-opus-4-6",
      "claude-opus-4-5-20251101",
      "claude-opus-4-5",
      "claude-sonnet-4-6",
      "claude-sonnet-4-5-20250929",
      "claude-sonnet-4-5",
      "claude-sonnet-4-20250514",
      "claude-3-7-sonnet-20250219"
    ],
    "standardPreferredModels": [
      "claude-sonnet-4-6",
      "claude-sonnet-4-5-20250929",
      "claude-sonnet-4-5",
      "claude-sonnet-4-20250514",
      "claude-3-7-sonnet-20250219"
    ]
  }
}
```

含义：

- `gpt-5.4` 视为高能力模型
- 高能力模型优先找 `opus`
- 如果没有 `opus`，就自动回退到 `sonnet`
- `gpt-5.3-codex` 默认按 `sonnet` 家族处理

---

## 5.4 `antigravityAliases`

用途：把 Antigravity 的 Claude 家族标准模型名映射成它真正的内部模型名。

默认：

```json
{
  "antigravityAliases": {
    "claude-sonnet-4-6": {
      "internal": "gemini-claude-sonnet-4-6",
      "public": "claude-sonnet-4-6",
      "equivalents": [
        "claude-sonnet-4-6",
        "gemini-claude-sonnet-4-6"
      ]
    },
    "claude-opus-4-6": {
      "internal": "gemini-claude-opus-4-6-thinking",
      "public": "claude-opus-4-6",
      "equivalents": [
        "claude-opus-4-6",
        "claude-opus-4-6-thinking",
        "gemini-claude-opus-4-6-thinking"
      ]
    }
  }
}
```

作用：

- 对外展示仍然可以是 `claude-sonnet-4-6`
- 真正发送给 Antigravity 时会变成 `gemini-claude-sonnet-4-6`

---

## 6. 当前默认行为总表

以下为当前系统默认内置行为。

## 6.1 下游是 Claude 客户端

### 6.1.1 Claude 协议层别名

默认会识别并归一化这些名称：

- `default`
- `default (recommended)`
- `sonnet`
- `sonnet (1m context)`
- `sonnet-1m`
- `sonnet 1m`
- `opus`
- `opus (1m context)`
- `opus-1m`
- `opus 1m`
- `haiku`
- `claude-sonnet-4.6`
- `claude-opus-4.6`
- `claude-haiku-4.5`

归一后的标准模型：

- `default` -> `claude-sonnet-4-6`
- `sonnet (1m context)` -> `claude-sonnet-4-6`
- `opus` -> `claude-opus-4-6`
- `haiku` -> `claude-haiku-4-5`

### 6.1.2 Claude -> OpenAI 兼容上游

适用上游：

- `openai-custom`
- `openaiResponses-custom`

默认行为：

- Claude 家族请求最终改写为 `gpt-5.4`

### 6.1.3 Claude -> Gemini CLI 上游

适用上游：

- `gemini-cli-oauth`

默认行为：

- Claude 家族请求最终改写为 `gemini-3.1-pro-preview`

### 6.1.4 Claude -> Kiro 上游

适用上游：

- `claude-kiro-oauth`

默认行为：

- Haiku 请求 -> `claude-haiku-4-5`
- 其他 Claude 家族请求 -> `claude-sonnet-4-5`

### 6.1.5 Claude -> Antigravity 上游

适用上游：

- `gemini-antigravity`

默认行为：

- `claude-sonnet-4-6` -> `gemini-claude-sonnet-4-6`
- `claude-opus-4-6` -> `gemini-claude-opus-4-6-thinking`
- 其他 Claude Sonnet 家族按 Sonnet 路由
- 其他 Claude Opus 家族按 Opus 路由

### 6.1.6 Claude -> Grok 上游

适用上游：

- `grok-custom`

默认行为：

- Claude 家族请求默认改写为 `grok-4.20`

---

## 6.2 下游是 Codex 客户端

当前优先兼容的 Codex 客户端模型：

- `gpt-5.3-codex (default)` -> `gpt-5.3-codex`
- `gpt-5.4 (current)` -> `gpt-5.4`

### 6.2.1 Codex -> Gemini CLI

默认行为：

- `gpt-5.3-codex` -> `gemini-3.1-pro-preview`
- `gpt-5.4` -> `gemini-3.1-pro-preview`

### 6.2.2 Codex -> OpenAI Codex 上游

适用上游：

- `openai-codex-oauth`

默认行为：

- `gpt-5.3-codex (default)` -> `gpt-5.3-codex`
- `gpt-5.4 (current)` -> `gpt-5.4`

也就是：

- Codex 原生模型名保持原样

### 6.2.3 Codex -> Claude 兼容上游

适用上游：

- `claude-custom`
- `claude-kiro-oauth`
- 其他 Claude 兼容上游

默认行为：

- `gpt-5.4` 优先映射到 `opus`
- 如果该上游没有 `opus`，自动回退到 `sonnet`
- `gpt-5.3-codex` 默认映射到 `sonnet`

### 6.2.4 Codex -> Antigravity

默认行为：

- `gpt-5.4` -> 先视作高能力模型 -> 选 `claude-opus-4-6` -> 再转为 `gemini-claude-opus-4-6-thinking`
- `gpt-5.3-codex` -> 视作标准模型 -> 选 `claude-sonnet-4-6` -> 再转为 `gemini-claude-sonnet-4-6`

### 6.2.5 Codex -> Grok

默认行为：

- `gpt-5.3-codex` / `gpt-5.4` 都会改写为 `grok-4.20`

---

## 7. 明确支持“真实模型直通”

这是管理员常见误解之一。

系统并不是强制所有请求都必须经过客户端模型转换。

如果请求本身已经直接指定了上游真实模型，系统会尽量保留原模型，不强行改写。

例如：

- 直接请求 `claude-sonnet-4-20250514`
- 直接请求 `grok-4.20-fast`
- 直接请求 `gpt-5.4`
- 直接请求 `gemini-claude-sonnet-4-6`

一般情况下：

- 原生真实模型会保持可用
- 只有“客户端模型名”或“跨家族不兼容模型”才会被映射

所以系统同时支持：

- 客户端习惯写法
- 管理员显式指定真实模型

---

## 8. 页面操作说明

## 8.1 查看当前生效规则

在管理页面：

1. 打开 `配置管理`
2. 滚动到 `服务治理`
3. 找到 `客户端模型路由表 (JSON)`

页面会显示：

- 当前默认规则与自定义规则合并后的结果

也就是说管理员在页面看到的是“当前实际生效版本”，不是纯空覆盖。

## 8.2 修改规则

建议流程：

1. 先复制当前 JSON 到本地备份
2. 只修改需要治理的那一段
3. 点击“保存配置”
4. 系统会写入 `configs/config.json`
5. 页面会触发配置重载
6. 再做一轮验证请求

## 8.3 回滚规则

有两种方式。

方式一：页面回滚

- 把 `clientModelRoutingRules` 改回 `{}` 并保存

结果：

- 恢复到系统内置默认规则

方式二：局部回滚

- 只删除你新增的那一段覆盖项

结果：

- 该字段回到默认内置值

---

## 9. `config.json` 配置示例

## 9.1 最小配置：完全使用默认规则

```json
{
  "clientModelRoutingRules": {}
}
```

## 9.2 示例：把 Claude -> OpenAI 上游默认模型改成 `gpt-5.4-mini`

```json
{
  "clientModelRoutingRules": {
    "providerTargets": {
      "openaiCompatible": {
        "defaultModel": "gpt-5.4-mini"
      }
    }
  }
}
```

注意：

- 这会影响 Claude 家族模型落到 OpenAI 兼容上游的默认目标
- 不会影响 Gemini CLI、Kiro、Grok、Antigravity 的默认路由

## 9.3 示例：给 Codex 新增一个客户端别名

```json
{
  "clientModelRoutingRules": {
    "protocolModelAliases": {
      "openai": {
        "gpt-5.4": [
          "gpt-5.4",
          "gpt-5.4 (current)",
          "gpt-5.4 stable"
        ]
      }
    }
  }
}
```

注意：

- 这是数组替换，不是数组追加
- 如果你这样写，原来的别名数组会被你这组新数组完整替换
- 所以如果你想保留原有别名，必须把原有值一并写进去

## 9.4 示例：把 Gemini CLI 默认接收模型改成 `gemini-2.5-flash`

```json
{
  "clientModelRoutingRules": {
    "providerTargets": {
      "geminiCli": {
        "defaultModel": "gemini-2.5-flash"
      }
    }
  }
}
```

影响：

- Claude 客户端模型打到 Gemini CLI 时会改成 `gemini-2.5-flash`
- Codex 客户端模型打到 Gemini CLI 时也会改成 `gemini-2.5-flash`

## 9.5 示例：调整 Codex 到 Claude 家族的优先顺序

```json
{
  "clientModelRoutingRules": {
    "providerTargets": {
      "codexToClaude": {
        "highCapabilityModel": "gpt-5.4",
        "supportedClientModels": [
          "gpt-5.3-codex",
          "gpt-5.4"
        ],
        "highCapabilityPreferredModels": [
          "claude-sonnet-4-6",
          "claude-sonnet-4-5"
        ],
        "standardPreferredModels": [
          "claude-sonnet-4-6",
          "claude-sonnet-4-5"
        ]
      }
    }
  }
}
```

结果：

- 即使上游支持 `opus`，也会优先选 `sonnet`

---

## 10. 推荐变更流程

建议管理员按下面流程治理。

### 10.1 变更前

- 确认下游客户端类型：
  - Claude 协议
  - OpenAI / Codex 协议
- 确认上游提供商类型：
  - `openai-custom`
  - `openaiResponses-custom`
  - `gemini-cli-oauth`
  - `gemini-antigravity`
  - `claude-custom`
  - `claude-kiro-oauth`
  - `grok-custom`
- 确认目标模型在上游真实可用
- 备份当前 `clientModelRoutingRules`

### 10.2 变更中

- 尽量一次只改一类映射
- 先改 `providerTargets`
- 再改 `protocolModelAliases`
- 不要一上来就同时改 fallback 和预路由

### 10.3 变更后

建议至少验证下面几类请求：

- Claude 客户端默认模型请求
- Claude 客户端 `1M` 上下文模型请求
- Codex 客户端 `gpt-5.3-codex (default)` 请求
- Codex 客户端 `gpt-5.4 (current)` 请求
- 直接指定真实模型请求

---

## 11. 排障说明

## 11.1 现象：页面保存后请求还是走旧模型

检查项：

- 是否真的点击了“保存配置”
- 是否触发了配置重载
- `clientModelRoutingRules` JSON 是否合法
- 是否改的是对象而不是忘记保留数组原值

重点：

- 数组是整段替换
- 不是自动追加

## 11.2 现象：节点选择阶段提示不支持该模型

通常原因：

- 你只改了上游目标，但没兼容客户端别名
- 或者某个节点配置了 `supportedModels`
- 或者某个节点配置了 `notSupportedModels`

排查建议：

1. 先看请求模型是否已被归一化
2. 再看该提供商的可用模型列表
3. 再看节点自己的 `supportedModels` / `notSupportedModels`

## 11.3 现象：Claude 客户端打 OpenAI 上游时没有变成 `gpt-5.4`

检查项：

- 上游是否真的是 `openai-custom` 或 `openaiResponses-custom`
- `providerTargets.openaiCompatible.defaultModel` 是否被覆盖成别的值
- 请求是否本身已经指定了上游真实模型

## 11.4 现象：Codex 打 Claude 上游没有走 Opus

检查项：

- 上游节点是否真的支持 `opus`
- `codexToClaude.highCapabilityPreferredModels` 是否已被调整
- `gpt-5.4` 是否仍被定义为 `highCapabilityModel`

## 11.5 现象：Antigravity 对外展示正常，但上游报模型不存在

检查项：

- `antigravityAliases` 中的 `internal` 是否写对
- `equivalents` 是否覆盖了对外和对内名称
- 上游实际可用模型是否仍然是该内部名称

---

## 12. 日志建议

变更完成后，建议管理员从日志观察以下信息：

- 请求进入时的原始模型
- 协议层归一化后的模型
- 选择节点时使用的模型
- 真正发送给上游的模型
- 是否触发了 fallback

如果要做上线验证，建议至少记录：

- 变更前 10 分钟
- 变更后 30 分钟

关注：

- 4xx 模型不存在错误
- 5xx 上游兼容错误
- 节点“模型不支持”比例是否异常上升

---

## 13. 推荐治理原则

建议遵守以下原则。

### 13.1 优先保留“真实模型直通”

如果业务方已经明确指定真实模型，不要为了统一命名而强制改写全部请求。

### 13.2 先收口客户端别名，再做上游切换

先把：

- `default`
- `1M`
- `(current)`
- `(default)`

这类名字统一掉，再调整上游模型。

### 13.3 一次只改一个上游家族

优先顺序建议：

1. `openaiCompatible`
2. `geminiCli`
3. `codexToClaude`
4. `antigravityAliases`

### 13.4 不要把 fallback 当成映射表

如果问题是“客户端名称不兼容”，改 `clientModelRoutingRules`。

如果问题是“主提供商不可用”，改 `providerFallbackChain`。

如果问题是“某个模型要强制换另一个提供商”，改 `modelFallbackMapping`。

---

## 14. 变更审计建议

建议管理员每次调整时记录：

- 变更时间
- 变更人
- 变更目标
- 影响的下游客户端
- 影响的上游提供商
- 预期新路由结果
- 回滚方案

建议保存一份变更前后的 JSON 对比。

---

## 15. 当前版本管理员最常用的治理点

一般最常改的是以下几项：

- `providerTargets.openaiCompatible.defaultModel`
- `providerTargets.geminiCli.defaultModel`
- `providerTargets.kiro.defaultModel`
- `providerTargets.kiro.haikuModel`
- `providerTargets.codexToClaude.highCapabilityPreferredModels`
- `protocolModelAliases.claude`
- `protocolModelAliases.openai`

最不建议随意调整的是：

- `antigravityAliases`

因为这一段直接影响 Antigravity 的真实上游内部模型名。

---

## 16. 结论

管理员可以把这套机制理解为：

- `clientModelRoutingRules` 负责“客户端名怎么认、上游模型怎么发”
- `providerFallbackChain` 负责“这个提供商不行了，换谁”
- `modelFallbackMapping` 负责“这个模型要不要强制改走另一路”

只要按这个边界治理，Claude / Codex / 真实模型直通三种场景可以同时共存，不会互相冲突。
