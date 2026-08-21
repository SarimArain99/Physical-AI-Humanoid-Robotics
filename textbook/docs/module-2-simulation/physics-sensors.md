---
sidebar_position: 3
title: Physics & Sensor Simulation
---

# Physics and Sensor Simulation

*Weeks 6–7: Realistic Dynamics, Collisions, and Virtual Sensors*

---

## Physics Engines

Gazebo supports multiple physics engines, each with trade-offs:

| Engine | Strengths | Best For |
|--------|-----------|----------|
| **ODE** | Fast, stable, default | General robotics |
| **Bullet** | Soft body, GPU support | Deformable objects |
| **DART** | Accurate dynamics | Research, humanoids |
| **Simbody** | Biomechanics | Human motion modeling |

### Rigid Body Dynamics

The fundamental equation governing robot simulation is **Newton-Euler**:

```
F = ma                    (Linear: Force = mass × acceleration)
τ = Iα                    (Angular: Torque = inertia × angular acceleration)
```

For a humanoid with `n` joints, the dynamics equation becomes:

```
M(q)q̈ + C(q, q̇)q̇ + G(q) = τ + J^T F_ext

Where:
  M(q)    = Mass matrix (n×n)
  C(q,q̇)  = Coriolis and centrifugal terms
  G(q)    = Gravity vector
  τ       = Joint torques (control inputs)
  J^T F   = External contact forces
```

---

## Simulating Walking

Bipedal walking is one of the most challenging simulation problems due to:

1. **Contact dynamics** — foot-ground interaction changes rapidly
2. **Balance** — the center of mass must stay over the support polygon
3. **Hybrid dynamics** — alternating between single and double support phases

### The Zero Moment Point (ZMP)

The ZMP is the point on the ground where the total moment of inertial and gravity forces is zero. For stable walking:

```
ZMP must remain inside the support polygon (foot contact area)
```

```python
def compute_zmp(com_position, com_acceleration, gravity=9.81):
    """
    Compute Zero Moment Point for balance assessment.
    
    Args:
        com_position: [x, y, z] center of mass position
        com_acceleration: [ax, ay, az] CoM acceleration
    
    Returns:
        [zmp_x, zmp_y] ground projection
    """
    x, y, z = com_position
    ax, ay, az = com_acceleration
    
    zmp_x = x - z * ax / (gravity + az)
    zmp_y = y - z * ay / (gravity + az)
    
    return [zmp_x, zmp_y]
```

---

## Simulating Sensors

### Camera Simulation

Gazebo renders virtual camera images using its 3D engine:

```xml
<sensor name="rgb_camera" type="camera">
  <camera>
    <horizontal_fov>1.047</horizontal_fov>
    <image>
      <width>640</width>
      <height>480</height>
    </image>
    <noise>
      <type>gaussian</type>
      <mean>0.0</mean>
      <stddev>0.007</stddev>
    </noise>
  </camera>
  <update_rate>30</update_rate>
</sensor>
```

### LiDAR Simulation

```xml
<sensor name="lidar" type="gpu_lidar">
  <lidar>
    <scan>
      <horizontal>
        <samples>360</samples>
        <min_angle>-3.14159</min_angle>
        <max_angle>3.14159</max_angle>
      </horizontal>
    </scan>
    <range>
      <min>0.1</min>
      <max>30.0</max>
    </range>
    <noise>
      <type>gaussian</type>
      <mean>0</mean>
      <stddev>0.01</stddev>
    </noise>
  </lidar>
  <update_rate>10</update_rate>
</sensor>
```

### IMU Simulation

```xml
<sensor name="imu_sensor" type="imu">
  <imu>
    <angular_velocity>
      <x><noise type="gaussian"><mean>0</mean><stddev>0.0002</stddev></noise></x>
      <y><noise type="gaussian"><mean>0</mean><stddev>0.0002</stddev></noise></y>
      <z><noise type="gaussian"><mean>0</mean><stddev>0.0002</stddev></noise></z>
    </angular_velocity>
    <linear_acceleration>
      <x><noise type="gaussian"><mean>0</mean><stddev>0.017</stddev></noise></x>
      <y><noise type="gaussian"><mean>0</mean><stddev>0.017</stddev></noise></y>
      <z><noise type="gaussian"><mean>0</mean><stddev>0.017</stddev></noise></z>
    </linear_acceleration>
  </imu>
  <update_rate>200</update_rate>
</sensor>
```

---

## The Sim-to-Real Gap

The difference between simulated and real-world performance is called the **sim-to-real gap**. Key factors:

| Factor | Simulation | Reality |
|--------|-----------|---------|
| Physics | Approximated | Complex, continuous |
| Sensors | Clean + noise model | Real noise, artifacts |
| Actuators | Ideal response | Delays, backlash, wear |
| Environment | Controlled | Variable, unpredictable |

### Domain Randomization

To bridge the gap, we **randomize** simulation parameters during training:

```python
randomization_params = {
    'friction': (0.3, 1.2),           # Uniform random range
    'mass_scale': (0.8, 1.2),         # ±20% mass variation
    'sensor_noise': (0.0, 0.05),      # Noise standard deviation
    'lighting': (0.3, 1.0),           # Brightness variation
    'joint_damping': (0.01, 0.1),     # Joint friction
    'actuator_delay': (0, 0.02),      # 0-20ms response delay
}
```

---

## Summary

- Multiple physics engines offer different trade-offs for humanoid simulation
- Walking simulation requires careful contact dynamics and ZMP stability
- Sensor simulation (camera, LiDAR, IMU) with noise models prepares for reality
- Domain randomization helps bridge the sim-to-real gap

---

*Next: [Unity for Robot Visualization →](./unity-visualization)*
