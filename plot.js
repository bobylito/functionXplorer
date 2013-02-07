// Plot.js 0.1 beta 
// http://bobylito.me/jsplot
// Licensed under MIT licence : http://bobylito.mit-license.org
//
// Library to plot functions in a 2D canvas.
// 
//## Usage :
//
//     window.jsPlot(
//        id,       // id of the div container (String)
//        settings, // plot setting as an object
//        functions // array of functions to draw on the canvas. 
//                  // Functions must be of the form : float -> float
//     )
//
//## Settings available : 
//
// * Xmin : minimum x value of the plot (default value : 0)
// * Xmax : maximum x value of the plot (default value : 10)
// * Ymin : minimum y value of the plot (default value : 0)
// * Ymax : maximum y value of the plot (default value : 3)
// * xLabel : x axis label (default value : x) 
// * yLabel : y axis label (default value : y)
// * canvasHeight : canvas height in pixels (default value : 500)
// * canvasWidth : canvas width in pixels (default value : 500)
// * gridVisible : is the grid visible? (default value : true)
//
//## Example of use :
//
//     jsPlot(
//       "plotHere", 
//       {
//         Xmin : -5,
//         Xmax : 5,
//         Ymin : -5,
//          Ymax : 5,
//         canvasHeight : 250,
//         canvasWidth : 250
//       },
//     [function x(x){return x}, 
//     function x2(x){return x*x}]);

// jsPlot is the function you'll use
window.jsPlot =
// w and d are respectively the window and the document; renamed here for ease of use. extend is a function that is not strict compliant so it is not included in the declaration scope of the library.
  (function(w, d, extend){
// Yes we can
    "use strict";
// All functions are stored in the utils object.
    var utils = {
      extend : extend,
// Given a dom id of an existing element, returns a 2d context 
// of either a newly created canvas or the existing one if it already exist. 
// It also sets the size to the canvas with the width and height attributes of the object set.
      createCanvas : function(id, set){
        var e = d.getElementById(id);
        var canvas = e.getElementsByTagName("canvas")[0];
        if(!canvas){
          canvas = d.createElement("canvas"); 
          e.appendChild(canvas);
        }
        canvas.width=set.canvasWidth;
        canvas.height=set.canvasHeight;
        return canvas.getContext("2d");
      },
// This function is from greweb's article about scaling grids : 
// http://http://blog.greweb.fr/2012/03/chart-libraries-headaches-finding-the-best-grid-step/
      findNiceRoundStep : (function() {
        var log10 = Math.log(10.),
            powOf10 = function(n) { 
              return Math.floor(Math.log(n)/log10) 
            };

        return function(delta, preferedStep) {
          var n = delta / preferedStep,
              p = powOf10(n), 
              p10 = Math.pow(10, p), 
              digit = n/p10;

          if(digit<1.5)
            digit = 1;
          else if(digit<3.5)
            digit = 2;
          else if(digit < 7.5)
            digit = 5;
          else {
            p += 1;
            p10 = Math.pow(10, p);
            digit = 1;
          }
          return digit * p10;
        };
      })(),
// Given a context c and the setting object set, the function draws the axis with labels.
// This function uses the attributes Xmas, Xmin, Ymax, Ymin, xLabel and
// yLabel of the setting objet.
      drawAxes : function(c, set){
        c.save()
        c.strokeStyle="#888";
        c.beginPath();
        c.moveTo((set.Xmin * set.xscale),0);
        c.lineTo((set.Xmax * set.xscale),0);  
        c.moveTo(0,(set.Ymin * set.yscale));
        c.lineTo(0,(set.Ymax * set.yscale));
        c.stroke();
       
        c.fillStyle = "black"; 
        c.beginPath();
        c.moveTo((set.Xmax * set.xscale),0);  
        c.lineTo((set.Xmax * set.xscale)-10,6);  
        c.lineTo((set.Xmax * set.xscale)-10,-6);  
        c.lineTo((set.Xmax * set.xscale),0);  
        c.moveTo(0,(set.Ymax * set.yscale));
        c.lineTo(-6,(set.Ymax * set.yscale)-10);
        c.lineTo(6,(set.Ymax * set.yscale)-10);
        c.lineTo(0,(set.Ymax * set.yscale));
        c.fill();

        c.scale(-1, 1);
        c.font = "13px helvetica";
        c.textAlign = "end";
        c.textBaseline = "bottom";

        c.rotate(Math.PI);
        c.save();
        c.translate((set.Xmax * set.xscale) - 13, -2);
        c.fillText(set.xLabel, 0, 0);
        c.restore();
        c.rotate(- Math.PI / 2);
        c.translate((set.Ymax * set.yscale) - 13, -2);
        c.fillText(set.yLabel,0 ,0);
        c.restore();
      },
// Given a canvas c and the setting object set, this function draws the grid.
// It uses the same set of setting parameters as the drawAxis function, except
// for the labels.
      drawGrid : function(c, set){
        var step = utils.findNiceRoundStep(set.Xmax - set.Xmin, 15);
        
        c.save();
        c.font = "15px helvetica";
        c.strokeStyle="#CCF";
        c.lineWidth=1.0;
        c.beginPath();

//The modulo is used to make the grid snap to the origin 
        for(var a=set.Xmin - set.Xmin%step; a<set.Xmax; a+=step){
          c.moveTo(a*set.xscale, set.Ymin * set.yscale);
          c.lineTo(a*set.xscale, set.Ymax * set.yscale);
        }
        c.stroke();

        c.beginPath();
// The modulo is used for the same reason here
        for(var b=set.Ymin - set.Ymin%step; b<set.Ymax; b+=step){
          c.moveTo(set.Xmin * set.xscale, b*set.yscale);
          c.lineTo(set.Xmax * set.xscale, b*set.yscale);
        }
        c.stroke();

// Let's add some numbers on axes        
        c.save();
        c.rotate(-Math.PI)
        c.scale(-1,1)
        for(var a=set.Xmin - set.Xmin%(2 *step); a<set.Xmax; a += 2 * step){
          c.fillText(
              Math.round(a*1000000)/1000000, 
              a * set.xscale, 
              0);
        }
        c.rotate(-Math.PI/2)
        for(var b=set.Ymin - set.Ymin%(2 * step); b<set.Ymax; b += 2 * step){
          var bPrime = Math.round(b*1000000)/1000000;
          if(bPrime === 0){
            continue;
          }
          c.fillText(
              bPrime, 
              b * set.yscale, 
              0);
        }
        c.restore();
        
        c.restore();
      },
// Given a canvas c, the setting object set and the function func, this function plots
// func on c in the respect of the parameters max and min of set.
// If the function contains a color attribute, it will be used for rendering 
// the function.
      drawFunction: function(c, set, func){
        try{
          var start = set.Xmin * set.xscale, 
              stop = set.Xmax * set.xscale,
              oldStrokeStyle = c.strokeStyle,
              color = func.color?func.color:"#000",
              width = func.width?func.width:1.0;
          c.lineWidth=width;
          c.strokeStyle = color;
          c.moveTo(start, func(start));
          c.beginPath();
          for(var i = start; i<=stop; i++){
            var y = func(i/set.xscale);
//On FF there is a graphical glitch with very big position values. This cap these values so it doesn't grow too big.
            y = y < set.Ymin ? set.Ymin -1 : y;
            y = y > set.Ymax ? set.Ymax + 1 : y;
            c.lineTo(i, y*set.yscale);
          }
          c.stroke();
        }catch(e){
          console.log("fonction en erreur", func, e);
        }finally{
          c.stokeStyle=oldStrokeStyle;
        }
      }
    }; 
// Default configuration 
    var defaultConfig = {
      Xmin : 0,          // x minimum value
      Xmax : 10,         // x maximum value
      Ymin : 0,          // y minimum value
      Ymax : 3,          // y maximum value
      xLabel : "x",      // x label value (text written on the horizontal axis)
      yLabel : "y",      // y label value (text written on the vertical axis)
      canvasHeight : 500,// vertical size of the canvas
      canvasWidth : 500, // horizontal size of the canvas
      gridVisible : true // is the grid visible?
    };

// plot.js main function
    var lib = function(id, settings, funcZ){
      var set = utils.extend({}, defaultConfig, settings),
          X = set.X = set.Xmax - set.Xmin,
          Y = set.Y = set.Ymax - set.Ymin,
          xscale = set.xscale = set.canvasWidth/X,
          yscale = set.yscale = set.canvasHeight/Y, 
          c = utils.createCanvas(id, set);
// Axis redefinition : so it makes more sense afterwards. 
      c.scale(1,-1);
      c.translate(0, -set.canvasHeight); //Finish axes changing properly
      c.translate(-(set.Xmin * xscale), -(set.Ymin * yscale) ); //Not 0,0 on bottom left :)  
//Background drawing
      if(set.gridVisible){
        utils.drawGrid(c, set);
      }
      utils.drawAxes(c, set);
//Draws all the functions
      for(var fi = 0; fi < funcZ.length; fi++){
        utils.drawFunction(c, set, funcZ[fi]);
      } 
    };

// Misc tools for new possibilities
    lib.tools = {
// Tranform a data set (array of points) into a function that can be rendered in plot.js
      datasetToFunc: function(datas){
        var f = datas.reduce(function(memo, current, index, datas){
// Verify next element 
              var next = datas[index+1];
              if(next === undefined){
                return function(x){
                  if(x > current[0]){
                    return undefined;
                  }
                  else {
                    return memo(x) 
                  }
                }
              }

// Calculate parameters for the new function f(x) = ax + b
              var a = (next[1] - current[1])/(next[0] - current[0]),
                  b = current[1] - a * current[0],
                  lowerBound = current[0],
                  f =  function(x){
                    if(x >= lowerBound){
                      return a * x + b;
                    }else{
                      return memo(x);
                    }
                  };
              console.log(a + "x + " + b)
              return f;
            }, function(x){return undefined;});
        return f;
      },
//Calculate the values on the grid step
      funcToDataset : function(f, settings){
        var step = utils.findNiceRoundStep(settings.Xmax - settings.Xmin, 15),
            res = [];
        for(var a=settings.Xmin - settings.Xmin%step; a<settings.Xmax; a+=step){
          res.push( f(a) );
        }
        return res;
      }
    };

    return lib;
   })(window, document, 
// extend is a function taken shamelessly from Zepto.js (https://github.com/madrobby/zepto). It does not comply to strict...
        function(target){
            [].slice.call(arguments, 1).forEach(function(source) {
              for (key in source) target[key] = source[key];
            })
            return target;
          });
