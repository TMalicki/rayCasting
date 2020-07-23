let canvas = $('canvas');
let raycast = canvas[0].getContext("2d");

let windowHeight = window.innerHeight;
let windowWidth = window.innerWidth;

canvas[0].width = windowWidth;
canvas[0].height = windowHeight;

let editorMode = true;

function clearWindow()
{
    raycast.fillStyle = 'black';
    raycast.fillRect(0, 0, windowWidth, windowHeight);
}

function checkKey(e)
{
    if(e.keyCode == "101" && editorMode == true) 
    {
        editorMode = false;
        canvas.off("click");
    }
    else if(e.keyCode == "101" && editorMode == false) 
    {
        editorMode = true;
        editor.addPoint();  // that should works only in editor mode
        editor.makeFigure();    // that should works only in editor mode
    }
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
    }

    addPoint()
    {
        if(editorMode == true)
        {
            const that = this;

            canvas.click(function(e) 
            { 
                if(that.newObstacle == true) 
                {
                    that.obstacles.push(new Obstacle);
                    that.newObstacle = false;
                }

                that.obstacles[that.obstacles.length - 1].points.push([e.clientX, e.clientY])
            })
        }
    }

    connectPoints(that)
    {
        that.newObstacle = true;
    }

    getMousePosition()
    {
        let mousePos = [];
        canvas.mousemove(function(e) { mousePos = [e.clientX, e.clientY]; });

        if(mousePos[0] != undefined)
        console.log(mousePos[0] + " " + mousePos[1]);

        return mousePos;
    }

    realTimeView()
    {
        let mousePos = this.getMousePosition();

        if(this.obstacles.length && mousePos)
        {
            let lastObstacle = this.obstacles.length - 1;
            let pointsInObstacle = this.obstacles[lastObstacle].points.length;
            let lastPoint = this.obstacles[lastObstacle].points[pointsInObstacle - 1];

           // console.log(mousePos[0] + " " + mousePos[1]);
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
                    raycast.closePath();
                    raycast.strokeStyle = 'red';
                    raycast.stroke();
                    raycast.fillStyle = 'grey';
                    raycast.fill();
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

        raycast.font = "30px Arial";
        raycast.fillStyle = 'white';
        if(editMode == true)
        {
            raycast.fillText("EditMode: OFF", 20, 50);
        }
        else
        {
            raycast.fillText("EditMode: ON", 20, 50);
        }
    }

    makeFigure()
    {
        if(editorMode == true)
        {
            const that = this;
            canvas.dblclick(function() { that.connectPoints(that); })
        }
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
editor.realTimeView();

//canvas.keypress( checkKey );
//canvas.on("keypress", function() { checkKey(); });
//$("document").on("keypress",  checkKey);

document.addEventListener("keypress", checkKey);
setInterval(function() { clearWindow(); editor.editor(); }, 1000/60);
