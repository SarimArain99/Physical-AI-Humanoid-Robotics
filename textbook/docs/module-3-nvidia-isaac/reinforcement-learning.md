---
sidebar_position: 3
title: Reinforcement Learning
---

# Reinforcement Learning for Robot Control

*Weeks 8–10: Training Robots Through Trial and Error*

---

## RL for Robotics

**Reinforcement Learning (RL)** trains agents by rewarding desired behaviors and penalizing undesired ones. For robotics, RL can discover control policies that are difficult or impossible to hand-engineer — like dynamic bipedal walking.

### The RL Framework

```
                    ┌─────────────┐
         action     │             │     observation
    ┌──────────────►│ Environment │──────────────┐
    │               │  (Isaac Sim)│              │
    │               └──────┬──────┘              │
    │                      │ reward               │
    │               ┌──────▼──────┐              │
    │               │             │              │
    └───────────────┤   Agent     │◄─────────────┘
                    │  (Policy)   │
                    └─────────────┘
```

### Key Components

| Component | Robotics Example |
|-----------|-----------------|
| **State** | Joint angles, velocities, IMU data, camera image |
| **Action** | Joint torques or position targets |
| **Reward** | Forward velocity - energy cost - fall penalty |
| **Episode** | One attempt at walking (ends on fall or time limit) |

---

## Training in Isaac Sim (Isaac Lab)

NVIDIA **Isaac Lab** (formerly Orbit) provides a framework for massively parallel RL training:

```python
# Isaac Lab environment configuration
from omni.isaac.lab.envs import ManagerBasedRLEnvCfg

class HumanoidWalkEnvCfg(ManagerBasedRLEnvCfg):
    """Configuration for humanoid walking task."""
    
    # Simulation
    sim_dt = 0.005          # 200 Hz physics
    decimation = 4           # Policy at 50 Hz
    episode_length_s = 20.0  # 20 second episodes
    
    # Parallel environments
    num_envs = 4096          # Train 4096 robots simultaneously!
    
    # Reward weights
    rewards = {
        'forward_velocity': 2.0,
        'alive_bonus': 0.5,
        'energy_penalty': -0.01,
        'joint_limit_penalty': -1.0,
        'fall_penalty': -10.0,
        'upright_bonus': 0.3,
    }
```

### Reward Shaping for Walking

```python
def compute_walking_reward(self, actions):
    """Multi-objective reward for bipedal locomotion."""
    
    # Reward forward velocity (toward target)
    forward_vel = self.robot.root_lin_vel[:, 0]  # x-velocity
    forward_reward = torch.clamp(forward_vel, 0, 2.0)
    
    # Penalize energy consumption
    torque = self.robot.applied_torque
    energy_penalty = torch.sum(torque ** 2, dim=-1)
    
    # Reward staying upright
    torso_up = self.robot.root_quat_w  # w component of quaternion
    upright_reward = torch.clamp(torso_up, 0, 1)
    
    # Penalize foot slipping
    foot_vel = self.robot.body_lin_vel[:, self.foot_indices]
    slip_penalty = torch.sum(foot_vel[:, :, :2] ** 2, dim=(-1, -2))
    
    total = (self.cfg.rewards['forward_velocity'] * forward_reward
           + self.cfg.rewards['alive_bonus']
           + self.cfg.rewards['energy_penalty'] * energy_penalty
           + self.cfg.rewards['upright_bonus'] * upright_reward
           - 0.1 * slip_penalty)
    
    return total
```

---

## Training Algorithms

### PPO (Proximal Policy Optimization)

The most common algorithm for robotic locomotion:

```python
from rsl_rl.runners import OnPolicyRunner

runner = OnPolicyRunner(
    env=env,
    algorithm="PPO",
    policy_cfg={
        'actor_hidden_dims': [256, 256, 128],
        'critic_hidden_dims': [256, 256, 128],
        'activation': 'elu',
    },
    algorithm_cfg={
        'learning_rate': 3e-4,
        'num_mini_batches': 4,
        'num_epochs': 5,
        'clip_param': 0.2,
        'gamma': 0.99,
        'lam': 0.95,
    },
    num_steps_per_env=24,
    max_iterations=5000,
)

runner.learn()
```

### Training Timeline

| Phase | Iterations | Robot Behavior |
|-------|-----------|----------------|
| 0–500 | Exploration | Falls immediately, random motion |
| 500–1500 | Basic balance | Stands, takes shaky steps |
| 1500–3000 | Walking | Consistent forward walking |
| 3000–5000 | Refinement | Smooth gait, energy efficient |

---

## Massively Parallel Training

Isaac Sim's GPU acceleration enables training at unprecedented scale:

```
Traditional (CPU):     1 robot  × real-time      = 1× data
Isaac Sim (GPU):    4096 robots × 10× real-time  = 40,960× data
```

A walking policy that would take **weeks** with a single robot can be trained in **hours** with Isaac Lab.

---

## Summary

- RL enables robots to discover complex behaviors like walking autonomously
- Isaac Lab supports massively parallel training (4096+ environments)
- Reward shaping is critical — balance multiple objectives carefully
- PPO is the standard algorithm for robotic locomotion
- GPU acceleration reduces training time from weeks to hours

---

*Next: [Sim-to-Real Transfer →](./sim-to-real)*
