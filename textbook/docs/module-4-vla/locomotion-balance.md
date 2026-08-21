---
sidebar_position: 2
title: Bipedal Locomotion
---

# Bipedal Locomotion and Balance Control

*Weeks 11–12: Making Humanoids Walk*

---

## The Challenge of Bipedal Walking

Walking on two legs is deceptively complex. Humans learn it over ~12 months of practice. For robots, bipedal locomotion requires solving several simultaneous problems:

- **Dynamic balance** — staying upright during motion
- **Footstep planning** — choosing where to place each foot
- **Trajectory generation** — smooth, energy-efficient paths
- **Ground contact** — managing impact forces
- **Disturbance rejection** — recovering from pushes and uneven terrain

---

## Walking Pattern Generation

### Linear Inverted Pendulum Model (LIPM)

The simplest model for bipedal walking treats the robot as a point mass on a massless leg:

```python
class LinearInvertedPendulum:
    """LIPM for CoM trajectory generation."""
    
    def __init__(self, com_height=0.8, gravity=9.81):
        self.z_c = com_height
        self.g = gravity
        self.omega = np.sqrt(gravity / com_height)
    
    def generate_trajectory(self, footsteps, step_time=0.6):
        """
        Generate CoM trajectory following footstep plan.
        Uses the analytical LIPM solution.
        """
        trajectory = []
        
        for i, (foot_x, foot_y) in enumerate(footsteps):
            for t in np.linspace(0, step_time, 30):
                # LIPM analytical solution
                x = foot_x + (self.x0 - foot_x) * np.cosh(self.omega * t) \
                    + self.vx0 / self.omega * np.sinh(self.omega * t)
                
                y = foot_y + (self.y0 - foot_y) * np.cosh(self.omega * t) \
                    + self.vy0 / self.omega * np.sinh(self.omega * t)
                
                trajectory.append({'x': x, 'y': y, 'z': self.z_c})
        
        return trajectory
```

---

## Footstep Planning

### A* Footstep Planner

```python
class FootstepPlanner:
    """Plan footstep sequence to reach a goal."""
    
    def __init__(self, step_length=0.3, step_width=0.2):
        self.step_length = step_length
        self.step_width = step_width
    
    def plan(self, start, goal, obstacles):
        """
        Generate footstep sequence avoiding obstacles.
        
        Returns:
            List of (x, y, theta, foot) tuples
        """
        footsteps = []
        current = start
        foot = 'left'
        
        while self.distance(current, goal) > self.step_length:
            # Direction to goal
            direction = self.normalize(goal - current)
            
            # Candidate step position
            step_pos = current + direction * self.step_length
            
            # Lateral offset based on which foot
            lateral = self.step_width / 2
            if foot == 'left':
                step_pos += self.perpendicular(direction) * lateral
            else:
                step_pos -= self.perpendicular(direction) * lateral
            
            # Check for collisions
            if not self.collides(step_pos, obstacles):
                footsteps.append((step_pos, foot))
                current = step_pos
                foot = 'right' if foot == 'left' else 'left'
            else:
                # Find alternative step
                step_pos = self.find_alternative(current, goal, obstacles)
                footsteps.append((step_pos, foot))
                current = step_pos
                foot = 'right' if foot == 'left' else 'left'
        
        return footsteps
```

---

## Whole-Body Control

For humanoids, walking isn't just about the legs — the entire body must be coordinated:

### Task Priority Framework

```
Priority 1: Don't fall         (Balance constraint)
Priority 2: Follow footsteps   (Walking task)
Priority 3: Avoid obstacles    (Collision avoidance)
Priority 4: Track hand target  (Manipulation task)
```

```python
class WholeBodyController:
    """Prioritized multi-task controller."""
    
    def compute(self, tasks):
        """
        Solve tasks in priority order using null-space projection.
        Higher priority tasks constrain lower priority ones.
        """
        q_dot = np.zeros(self.num_joints)
        N = np.eye(self.num_joints)  # Null-space projector
        
        for task in sorted(tasks, key=lambda t: t.priority):
            J = task.jacobian(self.current_state)
            e = task.error(self.current_state)
            
            # Solve in remaining null space
            J_N = J @ N
            J_N_pinv = np.linalg.pinv(J_N)
            q_dot += J_N_pinv @ (task.gain * e - J @ q_dot)
            
            # Update null-space projector
            N = N - J_N_pinv @ J_N
        
        return q_dot
```

---

## Disturbance Recovery

When pushed, a humanoid must quickly recover:

### Capture Point

The **capture point** is where the robot must step to prevent falling:

```python
def compute_capture_point(com_position, com_velocity, com_height, g=9.81):
    """
    Compute the capture point — where to step to avoid falling.
    
    If the capture point is outside the reachable area,
    the robot must take a recovery step.
    """
    omega = np.sqrt(g / com_height)
    
    capture_x = com_position[0] + com_velocity[0] / omega
    capture_y = com_position[1] + com_velocity[1] / omega
    
    return np.array([capture_x, capture_y])
```

---

## Summary

- LIPM provides a tractable model for CoM trajectory generation
- Footstep planning uses search algorithms to navigate around obstacles
- Whole-body control coordinates all joints using task priority
- Capture point theory enables push recovery and dynamic balance

---

*Next: [Conversational Robotics →](./conversational-robotics)*
