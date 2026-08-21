---
sidebar_position: 6
title: URDF for Humanoids
---

# URDF — Unified Robot Description Format

*Weeks 3–5: Describing Robot Structure for Simulation and Control*

---

## What is URDF?

**URDF (Unified Robot Description Format)** is an XML format that describes a robot's physical structure — its links (rigid bodies), joints (connections), visual appearance, collision geometry, and inertial properties.

Every simulator (Gazebo, Isaac Sim, Unity) and every motion planner in the ROS ecosystem uses URDF to understand what the robot looks like and how it moves.

---

## URDF Building Blocks

### Links

A **link** is a rigid body with visual, collision, and inertial properties:

```xml
<link name="torso">
  <visual>
    <geometry>
      <box size="0.4 0.3 0.6"/>
    </geometry>
    <material name="dark_gray">
      <color rgba="0.3 0.3 0.3 1.0"/>
    </material>
  </visual>
  <collision>
    <geometry>
      <box size="0.4 0.3 0.6"/>
    </geometry>
  </collision>
  <inertial>
    <mass value="15.0"/>
    <inertia ixx="0.5" ixy="0" ixz="0" iyy="0.4" iyz="0" izz="0.3"/>
  </inertial>
</link>
```

### Joints

A **joint** connects two links and defines how they move relative to each other:

| Joint Type | Degrees of Freedom | Example |
|-----------|-------------------|---------|
| `fixed` | 0 | Head mounted camera |
| `revolute` | 1 (rotation, limited) | Elbow, knee |
| `continuous` | 1 (rotation, unlimited) | Wheel |
| `prismatic` | 1 (translation, limited) | Linear actuator |
| `floating` | 6 | Free-floating base |

```xml
<joint name="left_shoulder_pitch" type="revolute">
  <parent link="torso"/>
  <child link="left_upper_arm"/>
  <origin xyz="0.2 0.15 0.25" rpy="0 0 0"/>
  <axis xyz="0 1 0"/>
  <limit lower="-3.14" upper="3.14" effort="100" velocity="2.0"/>
</joint>
```

---

## Humanoid URDF Structure

A simplified humanoid robot has approximately **20–30 joints**:

```
                    ┌──────┐
                    │ Head │
                    └──┬───┘
                       │ (neck)
              ┌────────┼────────┐
              │    ┌───┴───┐    │
    L.Shoulder│    │ Torso │    │R.Shoulder
              │    └───┬───┘    │
         ┌────┴──┐     │   ┌───┴────┐
         │L.Arm  │     │   │ R.Arm  │
         └────┬──┘     │   └───┬────┘
         ┌────┴──┐     │   ┌───┴────┐
         │L.Hand │     │   │ R.Hand │
         └───────┘     │   └────────┘
                   ┌───┴───┐
                   │ Waist │
              ┌────┴──┬────┴──┐
              │       │       │
         ┌────┴──┐  ┌─┴──┐ ┌─┴────┐
         │L.Leg  │  │    │ │R.Leg  │
         └────┬──┘  │    │ └──┬───┘
         ┌────┴──┐  │    │ ┌──┴───┐
         │L.Foot │  │    │ │R.Foot│
         └───────┘  └────┘ └──────┘
```

### Minimal Humanoid URDF

```xml
<?xml version="1.0"?>
<robot name="simple_humanoid" xmlns:xacro="http://www.ros.org/wiki/xacro">
  
  <!-- Base Link (Torso) -->
  <link name="base_link">
    <visual>
      <geometry><box size="0.3 0.2 0.5"/></geometry>
      <material name="blue"><color rgba="0.2 0.4 0.8 1.0"/></material>
    </visual>
    <collision><geometry><box size="0.3 0.2 0.5"/></geometry></collision>
    <inertial>
      <mass value="20.0"/>
      <inertia ixx="0.5" ixy="0" ixz="0" iyy="0.4" iyz="0" izz="0.2"/>
    </inertial>
  </link>

  <!-- Head -->
  <link name="head">
    <visual>
      <geometry><sphere radius="0.12"/></geometry>
      <material name="gray"><color rgba="0.6 0.6 0.6 1.0"/></material>
    </visual>
    <collision><geometry><sphere radius="0.12"/></geometry></collision>
    <inertial><mass value="2.0"/>
      <inertia ixx="0.01" ixy="0" ixz="0" iyy="0.01" iyz="0" izz="0.01"/>
    </inertial>
  </link>

  <joint name="neck_joint" type="revolute">
    <parent link="base_link"/>
    <child link="head"/>
    <origin xyz="0 0 0.35" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-1.57" upper="1.57" effort="10" velocity="1.0"/>
  </joint>

  <!-- Additional links and joints would follow for arms, legs, etc. -->
</robot>
```

---

## Xacro — Macros for URDF

Writing full URDF by hand is tedious. **Xacro** (XML Macros) adds variables, macros, and includes:

```xml
<!-- Define a reusable limb segment macro -->
<xacro:macro name="limb_segment" params="name length radius mass">
  <link name="${name}">
    <visual>
      <geometry><cylinder length="${length}" radius="${radius}"/></geometry>
    </visual>
    <inertial>
      <mass value="${mass}"/>
    </inertial>
  </link>
</xacro:macro>

<!-- Use the macro -->
<xacro:limb_segment name="left_upper_arm" length="0.3" radius="0.04" mass="2.5"/>
<xacro:limb_segment name="left_forearm" length="0.25" radius="0.035" mass="1.8"/>
```

---

## Visualizing URDF

```bash
# Check URDF for errors
check_urdf my_robot.urdf

# Visualize in RViz
ros2 launch urdf_tutorial display.launch.py model:=my_robot.urdf

# Generate URDF from Xacro
xacro my_robot.urdf.xacro > my_robot.urdf
```

---

## Summary

- **URDF** is the standard format for describing robot structure in ROS
- **Links** define rigid bodies; **Joints** define connections and motion
- Humanoids require 20–30+ joints to represent all degrees of freedom
- **Xacro** macros reduce repetition and make URDFs maintainable
- All major simulators (Gazebo, Isaac Sim) consume URDF

---

*Next: [Module 2 — Gazebo Simulation →](/docs/module-2-simulation/gazebo-setup)*
