---
sidebar_position: 4
title: Sim-to-Real Transfer
---

# Sim-to-Real Transfer Techniques

*Weeks 8–10: Deploying Simulation-Trained Policies to Real Hardware*

---

## The Sim-to-Real Challenge

A policy that works perfectly in simulation may **fail on real hardware** due to:

1. **Physics mismatches** — real contacts, friction, and deformation differ
2. **Sensor gaps** — real cameras have noise, blur, varying lighting
3. **Actuator dynamics** — real motors have delays, backlash, and limits
4. **Unmodeled effects** — cable drag, wind, temperature variations

---

## Domain Randomization

The most effective technique: **randomize everything** in simulation so the policy becomes robust to variations.

```python
class DomainRandomization:
    """Randomize simulation parameters each episode."""
    
    def randomize(self):
        return {
            # Physics randomization
            'friction': np.random.uniform(0.3, 1.5),
            'restitution': np.random.uniform(0.0, 0.5),
            'mass_scale': np.random.uniform(0.8, 1.2),
            
            # Actuator randomization
            'motor_strength': np.random.uniform(0.85, 1.15),
            'motor_delay': np.random.uniform(0, 20),  # ms
            'joint_damping': np.random.uniform(0.01, 0.1),
            
            # Sensor randomization
            'imu_noise_std': np.random.uniform(0.001, 0.05),
            'camera_noise_std': np.random.uniform(0.0, 0.03),
            'observation_delay': np.random.randint(0, 3),  # frames
            
            # Visual randomization (for camera-based policies)
            'lighting_intensity': np.random.uniform(0.3, 2.0),
            'texture_id': np.random.randint(0, 100),
            'background_color': np.random.uniform(0, 1, size=3),
        }
```

---

## System Identification

Match simulation parameters to real hardware through measurement:

```python
class SystemIdentification:
    """Measure real robot parameters to calibrate simulation."""
    
    def identify_motor(self, joint_name):
        """
        Send known commands, measure response.
        Fit motor model: τ = Kp(q_d - q) + Kd(q̇_d - q̇)
        """
        # Step response test
        command = step_signal(amplitude=0.5, duration=2.0)
        response = self.record_joint_response(joint_name, command)
        
        # Fit PD gains and delay
        Kp, Kd, delay = fit_second_order_system(command, response)
        
        return {'Kp': Kp, 'Kd': Kd, 'delay_ms': delay * 1000}
    
    def identify_friction(self, surface):
        """Push object on surface, measure deceleration."""
        # F_friction = μ × m × g
        # a_decel = μ × g
        deceleration = self.measure_deceleration(surface)
        mu = deceleration / 9.81
        return mu
```

---

## Deployment Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Train in    │     │  Export &     │     │  Deploy to   │
│  Isaac Sim   │────►│  Optimize    │────►│  Jetson/Robot │
│  (GPU Cloud) │     │  (TensorRT)  │     │  (Edge)      │
└─────────────┘     └──────────────┘     └─────────────┘
```

### Model Export

```python
import torch

# Export PyTorch policy to ONNX
policy = trained_agent.policy
dummy_input = torch.randn(1, obs_dim)

torch.onnx.export(
    policy,
    dummy_input,
    "walking_policy.onnx",
    input_names=['observation'],
    output_names=['action'],
    dynamic_axes={'observation': {0: 'batch'}, 'action': {0: 'batch'}}
)

# Convert to TensorRT for Jetson deployment
# trtexec --onnx=walking_policy.onnx --saveEngine=walking_policy.engine
```

### Real-Time Inference on Jetson

```python
import tensorrt as trt
import numpy as np

class PolicyRunner:
    """Run trained policy on Jetson at 50Hz."""
    
    def __init__(self, engine_path):
        self.engine = load_tensorrt_engine(engine_path)
        self.context = self.engine.create_execution_context()
    
    def get_action(self, observation):
        """Run inference: observation → action in <2ms."""
        input_data = np.array(observation, dtype=np.float32)
        output_data = np.empty(self.action_dim, dtype=np.float32)
        
        self.context.execute_v2([
            input_data.ctypes.data,
            output_data.ctypes.data
        ])
        
        return output_data
```

---

## Summary

- **Domain randomization** makes policies robust by training across varied conditions
- **System identification** calibrates simulation to match real hardware
- **TensorRT optimization** enables real-time inference on edge devices
- The pipeline: Train (cloud GPU) → Export (ONNX) → Optimize (TensorRT) → Deploy (Jetson)

---

*Next: [Module 4 — Humanoid Kinematics →](/docs/module-4-vla/humanoid-kinematics)*
