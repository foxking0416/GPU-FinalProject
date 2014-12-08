Interactive Globe: Global International Study
================
####CIS 565: GPU Programming - Final Project - 2014 Fall - University of Pennsylvania

####Authors:
* Wei-Chien Tu
  - foxking0416@gmail.com
  - https://github.com/foxking0416
* Lei Yang 
  - radiumyang@gmail.com
  - http://lovelessrara.wix.com/leiyang
  - https://github.com/radiumyang

####Live Demo:

####Walkthrough Video: http://youtu.be/mhCQRrjc6zM

####Final Presentation Slides:
* https://docs.google.com/presentation/d/1Jv2kuLtRkd-uKbQByFJf72L96bNAwOkvRSUU-BDX1vA/edit?usp=sharing

===================
12/7/2014 , Update
 
#### Final Features:
* 3D Interactive Globe (Three.js + GLSL)
  - Spiral Line Tube
  - Objloader
  - Skybox
  - Particle Animation
  - Country Obj meshes (10 main countries)
  - Obj vertices display and animations
  - Obj vertices interaction
* 2D UI (D3.js)
  - Bar graphs
  - Field of study switch buttons
  - Radar Chart (academic level)
  - History Timeline Diagram
  - Buttons

====================

#Overview
This project is a data visualization webGL application of global international study trends from 1940s to 2013.
We have two modes in this web page.
* General Trends (GT Mode)
* Field of Study (FOS Mode)

####Structure:
![1](images/structure.JPG)


#General Trends Mode (GT Mode)
*The first mode is the general trends which could show the data that students study abroad or international students come into this country.
![1](images/Readme1.png)

#### Visual-line Mesh
The yellow points represent students study abroad and purple points represent international students come into this country. 
The more points around a tube means the more students population from this country. Both the tube and points are built by using three.js library. 
To build the tube, we have to build the bezier curve first and then use this curve as the central axis to extrude the tube. 
To build the point, we use the position on the bezier curve every certain period and then using THREE.PointCloud to build them.  
![1](images/Readme2.png)
![1](images/visual-line.gif)

#### Flag Mesh
By clicking different country, it will show up the data from your selecting country. 
Besides, there will be a country name tag and country shape object with flag to tell users which coutry they just selected.
Right now we have built 9 countries geometry that could be shown(United States, China, South Korea, Japan, Inida, Vietnam, Taiwan, Turkey, Mexico)  
![1](images/Readme3.png)
![1](images/Readme4.png)

We used extrusion function to extrude the shape from 2D information and then apply alpha blending shaders with flag box. 
![1](images/Readme12.png)

#### Radar Chart
shows the student population of different academic levels. We use D3.js to build this effect.  
![1](images/Readme5.png)

#### Timeline History Gram
![1](images/Readme6.png)

#Field of Study Mode (FOS Mode)
* In our project demo, we use three top areas of study to show related features: 
  - Business
  - Engineer
  - Fine Arts

* When user clicked the field of study button, three features will be displayed:
  - Bar Graph (in the left bottom corner)
  - Sand-morphing Symbolized Model
  - Different texture of the globe mesh

#### Obj Model Morphing Transform

Besides, if the user switched to different field, then the vertices of this model will crash and drop to the ground and regenerate to become a new model. To build the vertices transformation effect, we used the bufferGeometry instead of Geometry in three.js to store all the vertices information including the position, normal and UVs. 

The benefit of using bufferGeometry is that it could reduce the cost of passing all this data to the GPU. However, 
the drawback is that we have to access the raw data from the appropriate attribute buffer.

After we build the bufferGeometry, then we could use THREE.PointCloud to build all the points we need.

![1](images/Readme7a.png)

* The vertices will crash and drop with an acceleration when user switches to other field.  
To do this effect, we have to provide each vertex with drop acceleration, ground position, drop time, global time and use vertex shader to compute the desired position for each vertex.

Actually, we could also change the position attribute data in bufferGeometry which we mentioned in the previous section. 
However, that is not done in vertex shader and will be much slower than our current method

![1](images/Readme8.png)

* When all the vertices of original model converge to a single point, we instantly change the model to another one and also inflate all the vertices to become a new model.

![1](images/Readme9.png)

* Obj Model Morphing Interaction (Just for fun!!)
  - Press '1' to '5', partially blow the model
    - Each number key could blow differnt part of the model and the blow direction is the camera direction (only affects x and z directions).
    - To achieve this effect, we have to assign each vertex with different blow time and blow direction, then use the specific vertex shader to compute the position for each vertex.
    -  ![1](images/Readme10.png)
    -  ![1](images/sand-morphing.gif)
  - Press 'b', wholy blow the model
    - ![1](images/Readme11.png)
    

#### Bar Graph
It dynamically shows the population data of the country in terms of different fields of study.
![1](images/de-bargraph.JPG)

#Performance Analysis
* With tube/ Without tube
* With vertices model / without vertices model
* Budhha model / digger model/ dollar model


#Reference
* http://threejs.org/
* http://armsglobe.chromeexperiments.com/
* https://github.com/alangrafu/radar-chart-d3


================
11/24/2014, Update

####Alpha Features:

* 3D Interactive Globe
  - Three.js, GLSL shaders
  - Features for alpha: 
    - Transparent globe with bumping map, rim, country outline
    - Country selection
    - Spiral line connections (basic)
    - Country Obj (test)
    - Area of study Obj (test)
* 2D UI
  - D3.js, html & css
  - Features for alpha:
    - history timeline
    - selected country name

===================
12/1/2014, Update

Beta Version Demo: http://foxking0416.github.io/GPU-FinalProject/

####Beta Features:
* 3D Interactive Globe (Three.js + GLSL)
  - Spiral Line Tube
  - Objloader
  - Skybox
  - Particle Animation
  - Country Obj meshes (5 main countries)
* 2D UI (D3.js)
  - Bar graphs
  - Field of study switch buttons
  - History Diagram
