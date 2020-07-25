let canvas = $('canvas');
let raycast = canvas[0].getContext("2d");

let windowHeight = window.innerHeight;
let windowWidth = window.innerWidth;

canvas[0].width = windowWidth;
canvas[0].height = windowHeight;


function clearWindow()
{
    raycast.fillStyle = 'black';
    raycast.fillRect(0, 0, windowWidth, windowHeight);
}

function checkKey(e)
{
    if(e.keyCode == "101" && editor.editorMode == true) 
    {
        editor.editorMode = false;
        canvas.off("click");
    }
    else if(e.keyCode == "101" && editor.editorMode == false) 
    {
        editor.editorMode = true;
        editor.addPoint();  // that should works only in editor mode
        editor.makeFigure();    // that should works only in editor mode
    }
    editor.fading = 0.0;
}

class Obstacle
{
    constructor()
    {
        this.points = [];
    }
}

class Editor
{
    constructor()
    {
        this.obstacles = [];      
        this.newObstacle = true; 
        this.fading = 0.0; 
        this.editorMode = true;
        this.mousePos = [];
    
        this.timer = 0;
        this.delay = 200;
        this.prevent = false;
    }

    addPoint()
    {
        if(this.editorMode == true)
        {
            const that = this;

            canvas.click(function(e) 
            { 
                that.timer = setTimeout(function() 
                {
                    if(!that.prevent)
                    {
                        if(that.newObstacle == true) 
                        {
                            that.obstacles.push(new Obstacle);
                            that.newObstacle = false;
                        }

                        that.obstacles[that.obstacles.length - 1].points.push([e.clientX, e.clientY])
                    }
                    that.prevent = false;
                }, that.delay);           
            })
        }
    }

    closeFigure()
    {
        this.obstacles[this.obstacles.length - 1].points.push(this.obstacles[this.obstacles.length - 1].points[0]);
    }

    makeFigure()
    {
        if(this.editorMode == true)
        {
            const that = this;
            canvas.dblclick(function() { clearTimeout(that.timer); that.prevent = true; that.connectPoints(); })
        }
    }

    getMousePosition()
    {
        let that = this;

        canvas.mousemove(function(e) { 
            that.mousePos = [e.clientX, e.clientY]; 
        });
    }

    connectPoints()
    {
        this.newObstacle = true;
        this.closeFigure();
    }

    realTimeView()
    {
        this.getMousePosition();

        if(this.obstacles.length && this.mousePos && this.newObstacle == false)
        {
           // debugger;
            let lastObstacle = this.obstacles.length - 1;
            let pointsInObstacle = this.obstacles[lastObstacle].points.length;
            let lastPoint = this.obstacles[lastObstacle].points[pointsInObstacle - 1];

           // raycast.beginPath(this);
            raycast.moveTo(lastPoint[0], lastPoint[1]);
            raycast.lineTo(this.mousePos[0], this.mousePos[1]);
            raycast.strokeStyle = 'red';
            raycast.stroke();
        }
    }

    draw()
    {
        if(this.obstacles.length)  
        { 
            let obstaclesSize = this.obstacles.length;
            for(let i = 0; i < obstaclesSize; i++)
            {
                let points = this.obstacles[i].points;

                if(points.length > 1)
                {
                    raycast.beginPath(this);
                    raycast.moveTo(points[0][0], points[0][1]);

                    for(let index = 1; index < points.length; index++)
                    {
                        raycast.lineTo(points[index][0], points[index][1]);
                    }
                    raycast.strokeStyle = 'red';
                    raycast.stroke();

                    if(points[0] == points[points.length - 1])
                    {
                        raycast.fillStyle = 'grey';
                        raycast.fill();
                    }
                }
                else
                {
                    raycast.fillStyle = 'red';
                    raycast.beginPath(this)
                    raycast.arc(points[0][0], points[0][1], 5, 0, 2 * Math.PI);
                    raycast.fill();
                }
            }
        }
    }

    editMode()
    {
        raycast.font = "30px Arial";
        raycast.globalAlpha -= this.fading;
        raycast.fillStyle = 'white';
        if(this.editorMode == true)
        {
            raycast.fillText("EditMode: ON", 20, 50);
        }
        else if(this.editorMode == false)
        {
            raycast.fillText("EditMode: OFF", 20, 50);
        }
        raycast.globalAlpha = 1.0;
    }

    fadeOut(decreasing)
    {
        if(this.fading < 1.0) this.fading += decreasing;
        if(this.fading > 1.0) this.fading = 1.0;
    }

    editor()
    {
        this.realTimeView();
        this.draw();
        this.editMode();
        this.fadeOut(0.005);
    }
}

class RayVision
{
    constructor()
    {
        this.playerPos = [windowWidth/2, windowHeight];
        this.playerRadius = 5;
        this.playerColor = 'red';

        this.angles = [];
        this.obstacleLines = [];
        this.polygons = [];
    }

    getMousePosition()
    {
        let that = this;

        canvas.mousemove(function(e) { 
            that.playerPos = [e.clientX, e.clientY]; 
        });
    }

    drawPlayer()
    {
        if(editor.editorMode == false)
        {
            this.getMousePosition();
            raycast.fillStyle = this.playerColor;
            raycast.beginPath(this)
            raycast.arc(this.playerPos[0], this.playerPos[1], this.playerRadius, 0, 2 * Math.PI);
            raycast.fill();   
        }
    }

    polygonsDraw()
    {
        let foreground = new Image();

        raycast.fillStyle = 'red';
        raycast.beginPath();
        raycast.moveTo(this.polygons[0].x, this.polygons[0].y);
        for(let i = 1; i < this.polygons.length; i++)
        {
            let intersects = this.polygons[i];
            raycast.lineTo(intersects.x, intersects.y);
        }
        raycast.fill();

        raycast.globalCompositeOperation = "source-in";
        raycast.drawImage(foreground, 0, 0);
        raycast.globalCompositeOperation = "source-over";
    }

    rayCastingAlgorithm()
    {
        let uniqueAngles = this.raysAngle();
        this.searchingObstacleLines();
        this.polygons = this.castRays(uniqueAngles);
        this.polygonsDraw();
    }

    // seems okay
    raysAngle()
    {
        let uniqueAngles = [];
        let obstaclesAll = editor.obstacles;
        for(let obstacleNr = 0; obstacleNr < obstaclesAll.length; obstacleNr++)
        {
            let pointsAll = obstaclesAll[obstacleNr].points;
            for(let pointNr = 0; pointNr < pointsAll.length; pointNr++)
            {
                let actualPoint = pointsAll[pointNr];
                let actualAngle = Math.atan2(actualPoint[1] - this.playerPos[1], actualPoint[0] - this.playerPos[0]);
                uniqueAngles.angles = actualAngle;
                uniqueAngles.push(actualAngle - 0.00001, actualAngle, actualAngle + 0.00001);
            }
        }
        return uniqueAngles;
    }

    // to check
    searchingObstacleLines()
    {
        let obstaclesAll = editor.obstacles;
        for(let obstacleNr = 0; obstacleNr < obstaclesAll.length; obstacleNr++)
        {
            let pointsAll = obstaclesAll[obstacleNr].points;
            for(let pointNr = 1; pointNr < pointsAll.length; pointNr++)
            {
                this.obstacleLines.push([[pointsAll[pointNr - 1][0], pointsAll[pointNr - 1][1]], [pointsAll[pointNr][0], pointsAll[pointNr][1]]]);
            }
        }
       
        this.obstacleLines.push([[0, 0],[windowWidth, 0]],
                                [[windowWidth, 0],[windowWidth, windowHeight]],
                                [[windowWidth, windowHeight],[0, windowHeight]],
                                [[0, windowHeight],[0, 0]]);
        
    }

    castRays(uniqueAngles)
    {
        let intersections = [];
        for(let angleIndex = 0; angleIndex < uniqueAngles.length; angleIndex++)
        {
            let dx = Math.cos(uniqueAngles[angleIndex]);
            let dy = Math.sin(uniqueAngles[angleIndex]);

            // line that goes through mousePos and mousePos + dx/dy (in direction of calculated angle)
            let ray = [[this.playerPos[0], this.playerPos[1]], 
                    [this.playerPos[0] + dx, this.playerPos[1] + dy]];   // thats casted ray
            
            // find closest intersection
            let closestIntersection = null;
            for(let index = 0; index < this.obstacleLines.length; index++)
            {
                let intersection = this.lineIntersection(ray, this.obstacleLines[index]);
                // if null was returned than do nothing
                if(!intersection) continue;
                // if there was no closestIntersection or if intersection parameter is smaller than parameter stored in closestIntersection
                if(!closestIntersection ||  intersection.param < closestIntersection.param)
                {
                    //debugger;
                    closestIntersection = intersection;
                }
            }

            if(!closestIntersection) continue;
      //      else
      //      {
                // angle for closestIntersection
                closestIntersection.angles = uniqueAngles[angleIndex];
                // add to list of intersections
                intersections.push(closestIntersection);
      //      }
        }

        //sort by angles
        intersections = intersections.sort(function(a, b){return a.angles - b.angles;});

        return intersections;
    }

    lineIntersection(ray, obstacle)
    {
        let x0_ray = ray[0][0];
        let y0_ray = ray[0][1];
        let vx_ray = ray[1][0] - x0_ray; // vx - velocity in x-axis in one frame (so basicly it is delta-x: [x-x0]);
        let vy_ray = ray[1][1] - y0_ray;

        let x0_obstacle = obstacle[0][0];
        let y0_obstacle = obstacle[0][1];
        let vx_obstacle = obstacle[1][0] - x0_obstacle;
        let vy_obstacle = obstacle[1][1] - y0_obstacle;

        // check for parallelism
        let rayMagnitude = Math.sqrt(Math.pow(vx_ray,2) + Math.pow(vy_ray,2));
        let obstacleMagnitude = Math.sqrt(Math.pow(vx_obstacle,2) + Math.pow(vy_obstacle,2));
        if(vx_ray / rayMagnitude == vx_obstacle / obstacleMagnitude && vy_ray / rayMagnitude == vy_obstacle / obstacleMagnitude)
        {
            return null; // lines are parelell
        }

        // for intersection y value of obstacle is the same as y value of ray, 
        // equations are:
        // x0_ray + vx_ray*T1 = x0_obstacle + vx_obstacle*T2
        // y0_ray + vy_ray*T1 = y0_obstacle + vy_obstacle*T2
        // after some shifting:
        let T2 = (vx_ray*(y0_obstacle - y0_ray) + vy_ray*(x0_ray - x0_obstacle)) / (vx_obstacle*vy_ray - vy_obstacle*vx_ray);
        let T1 =  (x0_obstacle + vx_obstacle *  T2 - x0_ray) / vx_ray;

        // if any of above the not intersect
        if(T1 < 0) return null;
        if(T2 < 0 || T2 > 1) return null;

        // return object with intersectionPoint and parametr T1
        return {x: x0_ray+vx_ray*T1,
                y: y0_ray+vy_ray*T1,
                param: T1
                };
    }
}

clearWindow();
let editor = new Editor();
let player = new RayVision();

editor.addPoint();  // that should works only in editor mode
editor.makeFigure();    // that should works only in editor mode

//canvas.keypress( checkKey );
//canvas.on("keypress", function() { checkKey(); });
//$("document").on("keypress",  checkKey);

document.addEventListener("keypress", checkKey);
setInterval(function() { clearWindow(); editor.editor(); player.drawPlayer(); if(editor.editorMode == false) { player.rayCastingAlgorithm(); }; }, 1000/60);
