/**
 * JS PLOT (yet again)
 * Little library to create function graphs
 */

window.jsPlot = 
  (function(w, d){
    
    var utils = {
      createCanvas : function(id){
        var e = d.getElementById(id);
        var canvas = d.createElement("canvas");
        canvas.width="500";
        canvas.height="500";
        e.appendChild(canvas);
        return canvas.getContext("2d");
      },
      drawAxes : function(c){
        c.beginPath();
        c.moveTo(0,0);
        c.lineTo(500,0);  
        c.moveTo(0,0);
        c.lineTo(0,500);
        c.stroke();
      },
      drawGrid : function(c, X, Y, xscale, yscale){
        //quadrillage 
        c.save();
        c.strokeStyle="#EEF";
        c.beginPath();
        for(var a=0; a<=X; a++){
          c.moveTo(a*xscale,0);
          c.lineTo(a*xscale,500);
        }
        c.stroke();

        c.beginPath();
        for(var b=0; b<=Y; b++){
          c.moveTo(0,b*yscale);
          c.lineTo(500, b*yscale);
        }
        c.stroke();
        c.restore();
      }
    }; 

    return function(id, settings, func){
      var X = 20;
      var Y = 3;

      var xscale = 500/X;
      var yscale = 500/Y;
      
      var c = utils.createCanvas(id);
      //Changement d'axes
      c.scale(1,-1);
      c.translate(0, -500);
      
      utils.drawAxes(c);
      utils.drawGrid(c, X, Y, xscale, yscale);

      //Tracé de la fonction
      c.beginPath();
      c.moveTo(0, func(0));
      for(var i = 0; i<=500; i++){
        var y = func(i/xscale);
        c.lineTo(i, y*yscale);
      }
      c.stroke();
    };
   })(window, document);
