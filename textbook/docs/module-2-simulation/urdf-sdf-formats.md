---
sidebar_position: 2
title: URDF and SDF Formats
---

# URDF and SDF Robot Description Formats

*Weeks 6–7: Comparing and Converting Robot Descriptions*

---

## URDF vs SDF

Both formats describe robots, but they serve different purposes:

| Feature | URDF | SDF |
|---------|------|-----|
| **Primary use** | ROS ecosystem | Gazebo simulator |
| **World description** | ❌ Robot only | ✅ Full worlds |
| **Multiple robots** | ❌ One per file | ✅ Multiple |
| **Closed-loop chains** | ❌ Tree only | ✅ Supported |
| **Sensor definitions** | Limited | ✅ Comprehensive |
| **Physics properties** | Basic | ✅ Detailed |

### When to Use Each

- **URDF** → ROS 2 tools (RViz, MoveIt, tf2), robot state publisher
- **SDF** → Gazebo worlds, complex environments, multi-robot scenarios

---

## SDF Model Example

```xml
<sdf version="1.8">
  <model name="humanoid_arm">
    <link name="shoulder">
      <inertial>
        <mass>3.0</mass>
        <inertia>
          <ixx>0.01</ixx><iyy>0.01</iyy><izz>0.005</izz>
        </inertia>
      </inertial>
      <visual name="shoulder_visual">
        <geometry><cylinder><radius>0.05</radius><length>0.1</length></cylinder></geometry>
      </visual>
      <collision name="shoulder_collision">
        <geometry><cylinder><radius>0.05</radius><length>0.1</length></cylinder></geometry>
      </collision>
    </link>

    <link name="upper_arm">
      <pose relative_to="shoulder">0 0 -0.2 0 0 0</pose>
      <inertial><mass>2.5</mass></inertial>
      <visual name="upper_arm_visual">
        <geometry><cylinder><radius>0.04</radius><length>0.3</length></cylinder></geometry>
      </visual>
    </link>

    <joint name="shoulder_joint" type="revolute">
      <parent>shoulder</parent>
      <child>upper_arm</child>
      <axis>
        <xyz>0 1 0</xyz>
        <limit><lower>-3.14</lower><upper>0.5</upper></limit>
      </axis>
    </joint>
  </model>
</sdf>
```

---

## Converting Between Formats

Gazebo automatically converts URDF to SDF internally, but you can do it manually:

```bash
# Convert URDF to SDF
gz sdf -p my_robot.urdf > my_robot.sdf

# Validate SDF
gz sdf -k my_robot.sdf
```

### Common Conversion Issues

1. **Missing inertial properties** — SDF requires inertial data for all non-static links
2. **Unsupported joint types** — URDF `planar` and `floating` joints need special handling
3. **Material definitions** — SDF uses Ogre/PBR materials vs. URDF's simple colors

---

## Adding Sensors in SDF

SDF provides detailed sensor definitions that URDF lacks:

```xml
<link name="head">
  <!-- Camera Sensor -->
  <sensor name="head_camera" type="camera">
    <pose>0.1 0 0.05 0 0 0</pose>
    <camera>
      <horizontal_fov>1.396</horizontal_fov>
      <image>
        <width>1280</width>
        <height>720</height>
        <format>R8G8B8</format>
      </image>
      <clip><near>0.1</near><far>100</far></clip>
    </camera>
    <always_on>true</always_on>
    <update_rate>30</update_rate>
  </sensor>

  <!-- IMU Sensor -->
  <sensor name="body_imu" type="imu">
    <always_on>true</always_on>
    <update_rate>200</update_rate>
    <imu>
      <angular_velocity>
        <x><noise type="gaussian"><stddev>0.001</stddev></noise></x>
      </angular_velocity>
      <linear_acceleration>
        <x><noise type="gaussian"><stddev>0.01</stddev></noise></x>
      </linear_acceleration>
    </imu>
  </sensor>
</link>
```

---

## Summary

- **URDF** is the standard for ROS tools; **SDF** is the standard for Gazebo
- SDF supports worlds, multiple robots, closed-loop chains, and rich sensors
- Automatic URDF→SDF conversion works but may need manual tuning
- Use sensor noise models to create realistic simulation data

---

*Next: [Physics and Sensor Simulation →](./physics-sensors)*
