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
    }
}

clearWindow();
let editor = new Editor();

editor.addPoint();  // that should works only in editor mode
editor.makeFigure();    // that should works only in editor mode

//canvas.keypress( checkKey );
//canvas.on("keypress", function() { checkKey(); });
//$("document").on("keypress",  checkKey);

document.addEventListener("keypress", checkKey);
setInterval(function() { clearWindow(); editor.editor(); editor.editMode(); editor.fadeOut(0.005); }, 1000/60);
