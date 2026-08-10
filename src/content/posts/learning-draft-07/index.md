---
title: "机器学习讲义笔记 2：强化学习与大模型对齐"
published: 2026-08-10
description: "从强化学习基础出发，梳理 SFT、PPO、DPO、GRPO 与大模型对齐中的核心目标、损失函数和训练流程。"
image: ""
tags:
  - 强化学习
  - PPO
  - RLHF
  - DPO
  - GRPO
category: 学习笔记
section: learning
draft: false
lang: zh_CN
---

# 强化学习与大语言模型对齐

这篇笔记从强化学习的基本对象出发，逐步连接到大语言模型中的 SFT、RLHF、PPO、DPO 与 GRPO。整理了一些我在学习机器学习讲义这本书时候问Gemini的一些问题，由Codex进行排版完善的。

## 1. 机器学习定义中的任务、经验与性能

Tom Mitchell 对机器学习的经典定义包含三个要素：任务 $T$、经验 $E$ 和性能度量 $P$。如果一个系统在执行任务 $T$ 时，其性能 $P$ 随经验 $E$ 增加而提升，就可以说它从经验中进行了学习。

### 1.1 三个要素分别回答什么问题

- **任务 $T$**：系统需要完成什么，例如分类、生成或序列决策。
- **经验 $E$**：模型从什么数据或交互中学习。
- **性能 $P$**：用什么指标判断模型有没有变好。

不同学习范式的区别，主要在于经验形式和学习信号不同：

| 学习范式 | 数学目标 | 经验形式 | 大模型中的例子 |
| --- | --- | --- | --- |
| 监督学习 | 学习条件分布 $P(y \mid x)$ | 输入与标签对 $(x,y)$ | SFT、分类任务 |
| 自监督学习 | 从数据自身构造预测目标 | 原始文本 Token 流 | 预训练中的下一个 Token 预测 |
| 强化学习 | 最大化期望累积回报 | 与环境交互得到的轨迹 | 基于奖励模型或规则奖励的对齐 |

预训练和 SFT 都能有效地进行概率拟合，但“是否符合人类偏好”往往没有唯一标准答案，也不一定能直接写成可微分的标签损失。RLHF 的基本思路，就是先把偏好变成奖励信号，再通过策略优化提高高奖励回答的概率。

## 2. 理解 PPO 前必须掌握的强化学习对象

### 2.1 状态、动作、策略与轨迹

在一般强化学习中：

- 状态 $s_t$ 表示时刻 $t$ 的环境信息；
- 动作 $a_t$ 是智能体在状态 $s_t$ 下做出的选择；
- 策略 $\pi_\theta(a_t \mid s_t)$ 给出动作的概率分布；
- 奖励 $r_t$ 评价当前动作或状态转移；
- 轨迹 $\tau=(s_0,a_0,r_0,\ldots,s_T)$ 记录一次完整交互。

折扣回报定义为：

$$
G_t = \sum_{k=0}^{T-t} \gamma^k r_{t+k},
$$

其中 $\gamma \in [0,1]$ 是折扣因子。强化学习希望找到参数 $\theta$，使期望回报最大：

$$
J(\theta)=\mathbb{E}_{\tau \sim \pi_\theta}\left[G_0\right].
$$

### 2.2 价值函数与优势函数

状态价值函数表示从状态 $s_t$ 出发，按当前策略继续行动时的期望回报：

$$
V^\pi(s_t)=\mathbb{E}_{\pi}\left[G_t \mid s_t\right].
$$

动作价值函数还考虑当前动作：

$$
Q^\pi(s_t,a_t)=\mathbb{E}_{\pi}\left[G_t \mid s_t,a_t\right].
$$

优势函数比较某个动作与当前策略平均水平的差异：

$$
A^\pi(s_t,a_t)=Q^\pi(s_t,a_t)-V^\pi(s_t).
$$

$A_t>0$ 表示这个动作比平均水平好，应提高它的概率；$A_t<0$ 表示它比平均水平差，应降低它的概率。

### 2.3 映射到大语言模型

在文本生成中，可以进行如下对应：

| 强化学习概念 | 大语言模型中的含义 |
| --- | --- |
| 状态 $s_t$ | Prompt 加上已经生成的 Token |
| 动作 $a_t$ | 下一个 Token |
| 策略 $\pi_\theta$ | 当前语言模型 |
| 轨迹 $\tau$ | 一条完整回答 |
| 奖励 | 奖励模型分数、规则校验结果或人工反馈 |

因此，大模型的生成过程本身就是一个序列决策过程。

## 3. 分层强化学习与多智能体强化学习

### 3.1 HRL：用时间抽象处理长程任务

分层强化学习（HRL）把长任务拆成不同时间尺度的决策。例如，上层策略选择“完成哪个子任务”，下层策略负责执行具体动作。

在半马尔可夫决策过程（SMDP）中，一个高层动作可以持续 $\tau$ 个时间步：

$$
P(s',\tau \mid s,a)
=P(s' \mid s,a,\tau)\,\omega(\tau \mid s,a).
$$

常见思路包括 Options、MAXQ 和 Manager–Worker 架构。它们主要缓解长程信用分配和搜索空间过大的问题。

### 3.2 MARL：局部执行与集中训练

多智能体强化学习（MARL）中的一个常见范式是 CTDE：集中式训练、分布式执行。训练阶段的 Critic 可以访问更完整的信息，执行阶段的 Actor 只依赖局部观测。

QMIX 通过单调性约束把个体价值组合成全局价值：

$$
\frac{\partial Q_{\mathrm{tot}}}{\partial Q_i} \ge 0.
$$

这个约束保证各智能体对局部价值的贪心选择与联合价值的最大化相容，但它也限制了能够表示的联合价值函数范围。

## 4. 模仿学习与逆强化学习

当奖励函数难以显式定义时，可以从专家行为反推目标。

- **行为克隆（BC）**：直接把专家轨迹当作监督数据，但容易受到分布偏移影响。
- **DAgger**：让当前策略访问自己会遇到的状态，再由专家补充正确动作，减少误差累积。
- **逆强化学习（IRL）**：从专家轨迹推断可能的奖励函数。
- **GAIL / AIRL**：使用对抗学习，使策略生成的轨迹接近专家轨迹。

它们与大模型偏好对齐的共同点是：目标行为并不总能由人工写出一个精确、可微的规则。

## 5. SFT 与 RLHF 的衔接

典型的 RLHF 流程可分为三步：

1. 使用高质量示范数据进行监督微调（SFT），得到具有基本指令遵循能力的模型。
2. 对同一 Prompt 的多个回答进行偏好排序，训练奖励模型（Reward Model）。
3. 使用 PPO 等强化学习算法，让策略模型提高奖励，同时限制它不要偏离 SFT 参考模型太远。

SFT 的作用不只是“先训练一下”，它还提供了合理的初始策略与参考分布。若直接从一个几乎不会遵循指令的基座模型开始在线强化学习，采样质量会很差，奖励模型也更容易被利用。

## 6. PPO：从目标函数到完整训练流程

### 6.1 PPO 是什么

PPO（Proximal Policy Optimization，近端策略优化）是一类 **on-policy 策略梯度算法**。它交替执行两件事：

1. 使用当前或旧策略与环境交互，采集一批轨迹；
2. 在这批数据上进行若干轮小批量梯度更新。

直接进行策略梯度更新时，如果一步把策略改得太多，新策略可能迅速偏离产生数据的旧策略，训练会变得不稳定。PPO 的核心目标是：**利用已有轨迹更新策略，同时限制单次更新幅度。**

### 6.2 从策略梯度到重要性采样比率

策略梯度的基本形式是：

$$
\nabla_\theta J(\theta)
=\mathbb{E}\left[
\nabla_\theta \log \pi_\theta(a_t \mid s_t)\,\hat A_t
\right].
$$

采样完成后，数据来自冻结的旧策略 $\pi_{\theta_{\mathrm{old}}}$。为了评价新策略对同一动作的概率变化，定义重要性采样比率：

$$
r_t(\theta)
=\frac{\pi_\theta(a_t \mid s_t)}
{\pi_{\theta_{\mathrm{old}}}(a_t \mid s_t)}
=\exp\left(
\log \pi_\theta(a_t \mid s_t)
-\log \pi_{\theta_{\mathrm{old}}}(a_t \mid s_t)
\right).
$$

- $r_t(\theta)>1$：新策略提高了该动作的概率；
- $r_t(\theta)<1$：新策略降低了该动作的概率；
- $r_t(\theta)=1$：新旧策略对该动作的概率相同。

不加约束的替代目标为：

$$
L^{\mathrm{CPI}}(\theta)
=\mathbb{E}_t\left[r_t(\theta)\hat A_t\right].
$$

### 6.3 PPO-Clip 的核心目标函数

PPO-Clip 把概率比率限制在 $[1-\epsilon,1+\epsilon]$ 附近，并取未裁剪项与裁剪项中更保守的一个：

$$
L^{\mathrm{CLIP}}(\theta)
=\mathbb{E}_t\left[
\min\left(
r_t(\theta)\hat A_t,
\operatorname{clip}\left(r_t(\theta),1-\epsilon,1+\epsilon\right)\hat A_t
\right)
\right].
$$

理解这个式子要分两种情况：

- 当 $\hat A_t>0$ 时，希望提高该动作概率，但 $r_t$ 超过 $1+\epsilon$ 后，继续提高不会增加裁剪目标。
- 当 $\hat A_t<0$ 时，希望降低该动作概率，但 $r_t$ 低于 $1-\epsilon$ 后，继续降低也不会带来额外收益。

所以，裁剪不是把梯度或参数直接截断，而是让“过度更新”失去目标函数上的好处。它近似实现了信赖域思想，同时比 TRPO 的二阶约束更容易实现。

### 6.4 Critic、TD 误差与 GAE

PPO 需要优势估计 $\hat A_t$。在 Actor–Critic 架构中，Critic 学习状态价值 $V_\phi(s_t)$。单步 TD 误差为：

$$
\delta_t
=r_t+\gamma V_\phi(s_{t+1})-V_\phi(s_t).
$$

广义优势估计（GAE）把多个时间尺度的 TD 误差加权组合：

$$
\hat A_t^{\mathrm{GAE}(\gamma,\lambda)}
=\sum_{l=0}^{T-t-1}(\gamma\lambda)^l\delta_{t+l}.
$$

$\lambda$ 控制偏差与方差的权衡：较小的 $\lambda$ 更依赖短期价值估计，方差较低但偏差可能更大；较大的 $\lambda$ 更接近蒙特卡洛回报，偏差较小但方差可能更高。

用于训练 Critic 的目标回报可以写成：

$$
\hat R_t=\hat A_t+V_\phi(s_t).
$$

价值损失通常采用均方误差：

$$
L^{\mathrm{VF}}(\phi)
=\mathbb{E}_t\left[
\left(V_\phi(s_t)-\hat R_t\right)^2
\right].
$$

一些实现还会裁剪价值函数的变化，但这属于实现选项，不是 PPO-Clip 定义中不可缺少的部分。

### 6.5 熵奖励与总损失

策略熵衡量动作分布的随机性：

$$
\mathcal{H}(\pi_\theta(\cdot \mid s_t))
=-\sum_a \pi_\theta(a \mid s_t)
\log \pi_\theta(a \mid s_t).
$$

熵奖励可以避免策略过早变得过于确定。若优化器以“最小化损失”的方式工作，一个常见的总损失写法是：

$$
L_{\mathrm{PPO}}
=-L^{\mathrm{CLIP}}
+c_v L^{\mathrm{VF}}
-c_H\,\mathbb{E}_t[\mathcal{H}_t].
$$

这里 $c_v$ 和 $c_H$ 分别控制价值损失与熵奖励的权重。Actor 和 Critic 可以共享部分参数，也可以是独立模型；在大模型 RLHF 中通常把它们视为两个不同角色。

### 6.6 RLHF 中的奖励与 KL 约束

奖励模型给出的通常是整条回答的序列级分数 $R_{\mathrm{RM}}(x,y)$。如果只最大化这个分数，Actor 可能钻奖励模型的漏洞，或快速偏离原本可读、可靠的语言分布。因此常引入相对参考模型 $\pi_{\mathrm{ref}}$ 的 KL 惩罚。

一种常见实现是给每个 Token 加上 KL 形状奖励：

$$
r_t^{\mathrm{KL}}
=-\beta\left[
\log\pi_\theta(a_t \mid s_t)
-\log\pi_{\mathrm{ref}}(a_t \mid s_t)
\right],
$$

并在序列结束时加入奖励模型分数：

$$
r_T=r_T^{\mathrm{KL}}+R_{\mathrm{RM}}(x,y).
$$

于是策略优化的直观目标是：

$$
\max_\theta\;
\mathbb{E}_{y\sim\pi_\theta(\cdot\mid x)}
\left[
R_{\mathrm{RM}}(x,y)
-\beta D_{\mathrm{KL}}
\left(
\pi_\theta(\cdot\mid x)
\,\|\,
\pi_{\mathrm{ref}}(\cdot\mid x)
\right)
\right].
$$

注意：KL 惩罚既可以被并入奖励，也可以作为额外损失项。实现时需要明确采用哪种方式，避免无意中重复计算。

### 6.7 一次 PPO-RLHF 迭代如何进行

完整流程可以概括为：

1. **冻结采样策略信息**：令 $\theta_{\mathrm{old}}\leftarrow\theta$，或至少保存采样时每个 Token 的旧 log probability。
2. **采样 Prompt**：从训练 Prompt 集合中取一个批次。
3. **生成回答**：Actor 按 $\pi_{\theta_{\mathrm{old}}}$ 自回归生成 Token，记录状态、动作与旧 log probability。
4. **计算奖励**：Reward Model 给整条回答打分；Reference Model 提供参考 log probability，形成 KL 惩罚。
5. **估计价值**：Critic 为各 Token 状态预测 $V_\phi(s_t)$。
6. **计算优势**：根据奖励、价值预测与终止掩码计算 $\delta_t$、GAE 优势 $\hat A_t$ 和回报目标 $\hat R_t$。
7. **标准化优势**：很多实现会在批次内标准化 $\hat A_t$，改善数值尺度，但它不是理论上强制的步骤。
8. **多轮小批量更新**：在同一批轨迹上进行若干个 epoch，最小化 Actor 与 Critic 的总损失。
9. **监控更新幅度**：观察近似 KL、clip fraction、奖励、熵和价值误差；若 KL 过大，可提前停止本轮更新或调整 $\beta$。
10. **丢弃旧轨迹并重新采样**：由于 PPO 是 on-policy 算法，策略更新后不能无限重复使用旧数据。

伪代码如下：

```text
repeat:
    trajectories = actor.generate(prompts)
    rm_scores = reward_model(trajectories)
    ref_logprobs = reference_model(trajectories)
    values = critic(trajectories)

    rewards = add_kl_penalty(rm_scores, actor_logprobs, ref_logprobs)
    advantages, returns = GAE(rewards, values)

    for epoch in range(K):
        for minibatch in trajectories:
            ratio = exp(new_logprobs - old_logprobs)
            actor_loss = -ppo_clip_objective(ratio, advantages)
            critic_loss = mse(new_values, returns)
            update(actor, critic)
```

### 6.8 四模型架构与显存占用

| 模型角色 | 核心职责 | 是否更新 | 主要显存来源 |
| --- | --- | --- | --- |
| Actor | 生成回答并计算新策略概率 | 是 | 权重、梯度、优化器状态、激活值 |
| Critic | 估计每个状态的价值 | 是 | 权重、梯度、优化器状态、激活值 |
| Reward Model | 对完整回答打分 | 否 | 权重与推理激活 |
| Reference Model | 提供 KL 参考分布 | 否 | 权重与推理激活 |

“旧策略”在公式中是第五个角色，但工程上不一定需要长期保存第五份完整模型：实现可以在采样时缓存旧 log probability，或使用阶段性冻结的 Actor 快照。

Actor 与 Critic 需要反向传播和优化器状态，通常是显存主要来源；Reward 与 Reference 虽然冻结，但大模型权重和推理激活仍然昂贵。ZeRO、FSDP、参数卸载、张量并行、梯度检查点和模型共置都是常见优化手段。

### 6.9 PPO 的常见失败模式

- **奖励投机**：模型找到奖励模型的漏洞，分数提高但真实质量下降。
- **KL 过大**：策略快速偏离参考模型，语言质量或安全性退化。
- **KL 过小**：约束太强，Actor 几乎无法学习新行为。
- **Critic 不准**：价值误差使优势估计噪声增大，Actor 更新不稳定。
- **奖励尺度失衡**：奖励过大或方差过高会导致梯度剧烈波动。
- **有效 Token 掩码错误**：把 Prompt、Padding 或终止后的 Token 纳入损失，会直接破坏训练信号。

## 7. DPO：把偏好优化转化为分类损失

DPO 使用离线偏好三元组 $(x,y_w,y_l)$，其中 $y_w$ 是偏好回答，$y_l$ 是非偏好回答。其经典损失为：

$$
\mathcal{L}_{\mathrm{DPO}}(\theta)
=-\mathbb{E}_{(x,y_w,y_l)}
\left[
\log\sigma\left(
\beta\log\frac{\pi_\theta(y_w\mid x)}{\pi_{\mathrm{ref}}(y_w\mid x)}
-\beta\log\frac{\pi_\theta(y_l\mid x)}{\pi_{\mathrm{ref}}(y_l\mid x)}
\right)
\right].
$$

DPO 不需要在训练循环中显式训练奖励模型、采样在线轨迹或训练 Critic，因此实现通常比 PPO-RLHF 简单。不过它依赖固定偏好数据，不能自动等价于所有在线 RLHF 场景；数据分布、偏好噪声和参考模型选择仍然会影响结果。

## 8. GRPO：用组内相对奖励替代 Critic

GRPO（Group Relative Policy Optimization）对同一个问题采样一组 $G$ 个回答，并用组内奖励统计量构造相对优势。一种常见写法为：

$$
\hat A_i
=\frac{R_i-\operatorname{mean}(R_1,\ldots,R_G)}
{\operatorname{std}(R_1,\ldots,R_G)+\varepsilon}.
$$

然后沿用类似 PPO 的裁剪目标，并加入相对参考策略的 KL 约束：

$$
J_{\mathrm{GRPO}}(\theta)
=\mathbb{E}\left[
\frac{1}{G}\sum_{i=1}^{G}
\left(
\min\left(
r_i(\theta)\hat A_i,
\operatorname{clip}(r_i(\theta),1-\epsilon,1+\epsilon)\hat A_i
\right)
-\beta D_{\mathrm{KL}}(\pi_\theta\|\pi_{\mathrm{ref}})
\right)
\right].
$$

GRPO 的关键收益是移除需要训练的 Critic，从而减少一类模型及其优化器状态。但它并不是“免费”的：每个问题需要生成多个回答，推理采样开销可能显著增加。

如果同组奖励完全相同，组内标准差接近零，归一化优势会接近零而不是“方差趋于无穷”。这意味着该组几乎不给策略提供相对学习信号。因此，奖励设计需要能够区分回答质量，组大小也会影响估计稳定性。

## 9. PPO、DPO 与 GRPO 的比较

| 方法 | 数据来源 | Reward Model | Critic | 在线采样 | 主要优点 | 主要代价 |
| --- | --- | --- | --- | --- | --- | --- |
| PPO-RLHF | 当前策略生成的轨迹 | 通常需要 | 需要 | 需要 | 可直接优化在线奖励 | 系统复杂、显存和采样成本高 |
| DPO | 固定偏好对 | 不显式需要 | 不需要 | 不需要 | 简单稳定、训练成本较低 | 依赖离线偏好数据分布 |
| GRPO | 同一 Prompt 的成组采样 | 可用规则或模型奖励 | 不需要 | 需要 | 省去 Critic，适合可验证奖励 | 多回答采样成本高，依赖组内差异 |

不能只根据“哪个省显存”判断算法优劣。还需要考虑奖励是否可验证、能否承担在线采样、偏好数据是否充足，以及是否需要探索当前策略尚未覆盖的行为。

## 10. DeepSeek-R1-Zero 与规则奖励

DeepSeek-R1-Zero 展示了在没有预先进行 SFT 冷启动的情况下，直接通过大规模强化学习激励推理行为的可能性。对于数学与代码等任务，答案正确性可以通过规则、测试用例或验证器检查，这类奖励比纯主观偏好更容易规模化。

不过，R1-Zero 也出现了可读性和语言混杂等问题。DeepSeek-R1 随后采用冷启动数据与多阶段训练改善这些缺陷。因此，“无需 SFT”是特定实验路线的重要结果，并不意味着所有对齐任务都应舍弃 SFT。

## 总结

PPO 的完整逻辑可以压缩成一句话：**旧策略生成轨迹，Reward Model 与 Reference Model 构造奖励，Critic 估计优势，Actor 在裁剪目标约束下提高高优势 Token 的概率。**

四模型显存只是 PPO-RLHF 的工程结果；真正的算法核心是重要性采样比率、裁剪替代目标、优势估计和受约束的多轮策略更新。DPO 用离线偏好分类绕开在线 RL，GRPO 用组内相对奖励绕开 Critic，它们分别交换了不同的计算成本、数据要求和探索能力。

## 参考资料

1. [Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347)
2. [High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438)
3. [Training Language Models to Follow Instructions with Human Feedback](https://arxiv.org/abs/2203.02155)
4. [Direct Preference Optimization: Your Language Model Is Secretly a Reward Model](https://arxiv.org/abs/2305.18290)
5. [DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models](https://arxiv.org/abs/2402.03300)
6. [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948)
