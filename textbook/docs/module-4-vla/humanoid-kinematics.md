---
sidebar_position: 1
title: Humanoid Kinematics
---

# Humanoid Robot Kinematics and Dynamics

*Weeks 11–12: Understanding Robot Motion*

---

## Forward Kinematics

**Forward kinematics** computes the position of the end-effector (hand, foot) given joint angles.

```
Joint Angles (θ₁, θ₂, ..., θₙ) → End-Effector Position (x, y, z, roll, pitch, yaw)
```

### Denavit-Hartenberg (DH) Parameters

Each joint is described by four parameters:

| Parameter | Symbol | Description |
|-----------|--------|-------------|
| Link length | a | Distance along x-axis |
| Link twist | α | Rotation around x-axis |
| Link offset | d | Distance along z-axis |
| Joint angle | θ | Rotation around z-axis |

### DH Transformation Matrix

```python
import numpy as np

def dh_transform(theta, d, a, alpha):
    """Compute the 4x4 DH transformation matrix."""
    ct, st = np.cos(theta), np.sin(theta)
    ca, sa = np.cos(alpha), np.sin(alpha)
    
    return np.array([
        [ct, -st*ca,  st*sa, a*ct],
        [st,  ct*ca, -ct*sa, a*st],
        [0,   sa,     ca,    d   ],
        [0,   0,      0,     1   ]
    ])

def forward_kinematics(joint_angles, dh_params):
    """Compute end-effector pose from joint angles."""
    T = np.eye(4)
    for i, (theta, d, a, alpha) in enumerate(dh_params):
        T = T @ dh_transform(joint_angles[i] + theta, d, a, alpha)
    return T
```

---

## Inverse Kinematics (IK)

**Inverse kinematics** solves the opposite problem: given a desired end-effector position, find the joint angles.

```
Desired Position (x, y, z) → Joint Angles (θ₁, θ₂, ..., θₙ)
```

### Jacobian-Based IK

```python
class InverseKinematics:
    def solve(self, target_position, current_angles, max_iter=100):
        """Iterative IK using Jacobian pseudo-inverse."""
        angles = current_angles.copy()
        
        for i in range(max_iter):
            # Current end-effector position
            current_pos = self.forward_kinematics(angles)
            
            # Error
            error = target_position - current_pos
            if np.linalg.norm(error) < 1e-4:
                return angles  # Converged
            
            # Compute Jacobian
            J = self.compute_jacobian(angles)
            
            # Pseudo-inverse update
            J_pinv = np.linalg.pinv(J)
            delta_angles = J_pinv @ error
            
            # Apply with step size
            angles += 0.5 * delta_angles
            
            # Enforce joint limits
            angles = np.clip(angles, self.joint_limits[:, 0], 
                           self.joint_limits[:, 1])
        
        return angles
```

---

## Bipedal Locomotion

### The Gait Cycle

Human walking follows a repeating cycle:

```
   Heel Strike → Foot Flat → Mid-Stance → Heel Off → Toe Off → Swing
   ├─────────── Stance Phase (60%) ──────────┤├── Swing (40%) ──┤
```

### Center of Mass (CoM) Trajectory

During walking, the CoM follows an **inverted pendulum** trajectory:

```python
class WalkingController:
    def generate_com_trajectory(self, step_length, step_height, 
                                 step_time, num_steps):
        """Generate center of mass trajectory for walking."""
        trajectory = []
        
        for step in range(num_steps):
            t_start = step * step_time
            
            for t in np.linspace(0, step_time, 50):
                # Sagittal plane (forward)
                x = step * step_length + step_length * t / step_time
                
                # Vertical bounce (inverted pendulum)
                z = self.com_height + 0.02 * np.sin(np.pi * t / step_time)
                
                # Lateral sway
                y = 0.04 * np.sin(2 * np.pi * t / step_time) * (-1)**step
                
                trajectory.append({
                    'time': t_start + t,
                    'com': [x, y, z],
                    'support_foot': 'left' if step % 2 == 0 else 'right'
                })
        
        return trajectory
```

---

## Balance Control

### PD Balance Controller

```python
class BalanceController:
    def __init__(self, Kp=100.0, Kd=20.0):
        self.Kp = Kp
        self.Kd = Kd
    
    def compute_torques(self, desired_angles, current_angles,
                        current_velocities):
        """PD controller for joint torques."""
        position_error = desired_angles - current_angles
        velocity_error = -current_velocities
        
        torques = self.Kp * position_error + self.Kd * velocity_error
        
        # Clamp to motor limits
        torques = np.clip(torques, -self.max_torque, self.max_torque)
        return torques
```

---

## Manipulation and Grasping

### Grasp Types for Humanoid Hands

| Grasp Type | Description | Objects |
|-----------|-------------|---------|
| **Power grasp** | Full hand wrap | Bottles, tools |
| **Precision grasp** | Fingertip pinch | Screws, coins |
| **Lateral pinch** | Thumb against index side | Cards, keys |
| **Tripod** | Thumb + two fingers | Pens, small objects |

---

## Summary

- Forward kinematics maps joint angles to end-effector positions using DH parameters
- Inverse kinematics solves for joint angles given desired positions
- Walking follows a gait cycle with stance and swing phases
- Balance control uses PD controllers to maintain stability
- Humanoid hands use multiple grasp types for different objects

---

*Next: [Bipedal Locomotion →](./locomotion-balance)*
