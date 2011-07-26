/**
 * JS PLOT (yet again)
 * Little library to create function graphs
 */

window.jsPlot = 
  (function(w, d){
    
    var utils = {
     
      extend : function(target){
        //This method is from Zepto.js (https://github.com/madrobby/zepto)
        [].slice.call(arguments, 1).forEach(function(source) {
          for (key in source) target[key] = source[key];
        })
        return target;
      },
      createCanvas : function(id, set){
        var e = d.getElementById(id);
        var canvas = e.querySelectorAll("canvas")[0];
        if(!canvas){
          canvas = d.createElement("canvas"); 
          e.appendChild(canvas);
        }
        canvas.width=set.canvasWidth;
        canvas.height=set.canvasHeight;
        return canvas.getContext("2d");
      },
      drawAxes : function(c, set){
        c.save()
        c.strokeStyle="#888"
        c.beginPath();
        c.moveTo((set.Xmin * set.xscale),0);
        c.lineTo((set.Xmax * set.xscale),0);  
        c.moveTo(0,(set.Ymin * set.yscale));
        c.lineTo(0,(set.Ymax * set.yscale));
        c.stroke();
        c.restore();
      },
      drawGrid : function(c, set){
        //quadrillage 
        c.save();
        c.strokeStyle="#EEF";
        c.beginPath();
        for(var a=set.Xmin; a<=set.Xmax; a++){
          c.moveTo(a*set.xscale, set.Ymin * set.yscale);
          c.lineTo(a*set.xscale, set.Ymax * set.yscale);
        }
        c.stroke();

        c.beginPath();
        for(var b=set.Ymin; b<=set.Ymax; b++){
          c.moveTo(set.Xmin * set.xscale, b*set.yscale);
          c.lineTo(set.Xmax * set.xscale, b*set.yscale);
        }
        c.stroke();
        c.restore();
      },
      drawFunction: function(c, set, func){
        var start = set.Xmin * set.xscale;
        var stop = set.Xmax * set.xscale;
        c.moveTo(start, func(start));
        c.beginPath();
        for(var i = start; i<=stop; i++){
          var y = func(i/set.xscale);
          c.lineTo(i, y*set.yscale);
        }
        c.stroke();
      }
    }; 

    var defaultConfig = {
      Xmin : 0,
      Xmax : 10,
      Ymin : 0,
      Ymax : 3,
      canvasHeight : 500,
      canvasWidth : 500
    };

    return function(id, settings, funcZ){
      var set = utils.extend({}, defaultConfig, settings);
      
      var X = set.X = set.Xmax - set.Xmin;
      var Y = set.Y = set.Ymax - set.Ymin;

      var xscale = set.xscale = set.canvasWidth/X;
      var yscale = set.yscale = set.canvasHeight/Y;
      
      var c = utils.createCanvas(id, set);
      //Axes redefinition
      c.scale(1,-1);
      c.translate(0, -set.canvasHeight); //Finish axes changing properly
      c.translate(-(set.Xmin * xscale), -(set.Ymin * yscale) ); //Not 0,0 on bottom left :)  
     
      //Background 
      utils.drawGrid(c, set);
      utils.drawAxes(c, set);

      //Tracé de la fonction
      for(var fi = 0; fi < funcZ.length; fi++){
        utils.drawFunction(c, set, funcZ[fi]);
      } 
    };
   })(window, document);
