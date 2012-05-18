/* Application jsPlot
 *
 * Based on backbone.js
 */

(function($, colors){
  var eventUtils = {
    attachWheelHandler:function(handler){
      var h = function(e, delta, deltaX, deltaY){
        var d = deltaY * 40,
            pos = {
              x : e.layerX / this.offsetWidth, 
              y : 1 - e.layerY / this.offsetHeight
            }; 
        handler(d, pos);
      };
      $("#graph").mousewheel(h);
    }
  };
   
  var Config = Backbone.Model.extend({
      defaults:{
        Xmin : -5,
        Xmax : 5, 
        Ymin : -5,
        Ymax : 5,
        canvasHeight : 600,
        canvasWidth : 800, 
        xLabel : "X",
        yLabel : "Y",
        gridVisible : true
      },
      validate: function(attrs){
        if(attrs.Xmin >= attrs.Xmax){
          return "Xmin > Xmax ";
        }
        if(attrs.Ymin >= attrs.Ymax){
          return "Ymin > Ymax ";
        }
      }, 
      reset : function(){
        var Ydelta = this.defaults.Ymax - this.defaults.Ymin,
            canvasHeight = this.get('canvasHeight'),
            canvasWidth = this.get('canvasWidth'),
            Xdelta = Ydelta/canvasHeight * canvasWidth, 
            newConfig = _.extend(this.defaults, {
              canvasHeight : canvasHeight,
              canvasWidth : canvasWidth,
              Xmax : Xdelta/2,
              Xmin : -Xdelta/2
            } );
        this.set(newConfig);
      }
    });


  var ConfigView = Backbone.View.extend({
      tagName : 'div',
      events : {
        //"keyup input" : "update",
        "change input" : "update",
        "click button.reset" : "reset"
      },
      template : _.template($("#config-template").html()),
      initialize : function(config){
        _.bindAll(this, 'render', 'update', "reset");
        config.reset();
        this.model = config;
        this.model.bind("change", this.render);
      },
      render : function(){
       $(this.el).html(this.template(this.model.toJSON()));
       return this;
      },
      update : function(){
       var newConfig = {};
       $('input', this.el).each(function(i, elt){
// It seems getAttribute returns the value that is the html, while accessing the type attribute directly returns the value understood by the browser. It creates a bug in FFbecause it doesn't know about input type number
        var type = elt.getAttribute("type");
        if(type === "number"){ 
          newConfig[elt.id]=parseFloat(elt.value, 10);
        }else if(type === "checkbox"){
          newConfig[elt.id]= true && (elt.checked);
        }else{
          newConfig[elt.id]=elt.value;
        }
       });
       this.model.set(newConfig);
      }, 
      reset: function(){
       this.model.reset();
      }
    });


  var GraphView = Backbone.View.extend({
      tagName : 'div',
      events : {
        'mousedown canvas': 'click',
        'mouseup canvas': 'unClick',
        'mousemove canvas' : 'proxyMovementHandler'
      },
      defaultF : function(){return undefined},
      initialize : function(config, formulas){
        _.bindAll(this, 'render', 'update', 'click', 'onMove', 'onNotMove', 'proxyMovementHandler');
        this.conf = config;
        this.conf.bind("change", this.update);
        this.formulas = formulas;
        this.formulas.bind("change", this.update);
        this.formulas.bind("add", this.update);
        this.formulas.bind("remove", this.update);
        $(this.el).attr("id", "graph");
        this.unClick();
        this.mousePosDOM = $("#position");
        this.mousePosTemplate = _.template($("#position-template").html());
      },
      render : function(config){
       return this; 
      },
      update : function(){
       var functions = this.formulas
         .select(function(e){
          return e.get('visible');
         })
         .map(function(f, i){
          try{
            var f = new Function("x", "return "+f.get("bodyAsString")+";");
            f.color = colors[i % colors.length];
            f.width = 1.0;
            return f;
          }
          catch(e){
            return this.defaultF;
          }
         }, this);
       jsPlot("graph", this.conf.toJSON(), functions);
      },
      proxyMovementHandler: function(e){
        this.movementHandler(e);
      },
      movementHandler : function(e){
        //console.log(e, "Not initialized");
      },
      onMove : function(e){
        var xmin = this.conf.get('Xmin'),
            ymin = this.conf.get('Ymin'),
            xmax = this.conf.get('Xmax'),
            ymax = this.conf.get('Ymax'),
            width = xmax - xmin,
            height = ymax - ymin,
            canvasHeight = this.conf.get("canvasHeight"),
            canvasWidth = this.conf.get("canvasWidth"),
            vT = {
              i : -((e.layerX - this.lastState.x)/canvasWidth*width),
              j : (e.layerY - this.lastState.y)/canvasHeight*height
            },
            newConfig = {
              Xmin : xmin + vT.i,
              Xmax : xmax + vT.i,
              Ymin : ymin + vT.j, 
              Ymax : ymax + vT.j
            };

        this.conf.set(newConfig);
        this.lastState = {
          x:e.layerX,
          y:e.layerY
        };
      },
      onNotMove : function(e){
        // When not moving we need to get the position of the position on the graph
        var xmin = this.conf.get('Xmin'),
            ymin = this.conf.get('Ymin'),
            xmax = this.conf.get('Xmax'),
            ymax = this.conf.get('Ymax'),
            width = xmax - xmin,
            height = ymax - ymin,
            canvasHeight = this.conf.get("canvasHeight"),
            canvasWidth = this.conf.get("canvasWidth"),
            data = {
                x:Math.floor((xmin + e.layerX/canvasWidth*width)*100)/100,
                y:Math.floor((ymax - (e.layerY)/canvasHeight*height)*100)/100
              };
        this.mousePosDOM.html(this.mousePosTemplate(data));
      },
      click : function(e){
        this.lastState = {
          x:e.layerX,
          y:e.layerY
        };
        this.movementHandler = this.onMove;
      },
      unClick : function(e){
        //console.log(e);
        this.movementHandler = this.onNotMove;
      }
    });

  var Formula = Backbone.Model.extend({
      defaults:{
        bodyAsString : "x",
        visible : true
      }
    });
  
  var Formulas = Backbone.Collection.extend({
      model : Formula,
      localStorage : new Store("formulas")
    });

  var FormulaView = Backbone.View.extend({
      tagName : "li",
      template : _.template($("#formula-template").html()),
      events : {
        "keyup input": "updateBody",
        "click .visible": "updateBody",
        "click .delete": "removeView"
      },
      initialize : function(){
        _.bindAll(this, 'render', 'updateBody', 'removeView');
      },
      render : function(){
        var data = this.model.toJSON();
        data.visible = data.visible?"checked":"";
        $(this.el).html(this.template(data));
        return this;
      },
      removeView : function(){
        this.model.destroy();
        $(this.el).remove();
      },
      updateBody :function(){
        $el = $(this.el);
        var body = $el.find(".formula").attr("value"),
            isVisible = $el.find(".visible:checked").length===1;
        this.model.save({
          bodyAsString : body,
          visible : isVisible
        });

      }
  });

  var AppView = Backbone.View.extend({
      el: $("body"),
      events : {
        "click #addFormula": "addFormula",
        "click div.button" : "hideShowPanel"
      },
      initialize : function(){
        _.bindAll(this, 'render', 'addFormula', 'appendFormula', 'wheelHandler');
        this.config = configuration = new Config({
            canvasWidth : window.innerWidth,
            canvasHeight : window.innerHeight - $("header").height()-4
          });
        
        //Collection formula
        this.formulas = new Formulas();
        this.formulas.bind("add", this.appendFormula);
        this.formulas.fetch();

        this.configView = new ConfigView(configuration);
        this.graphView = new GraphView(configuration, this.formulas);

        this.render();

        configuration.change();
        eventUtils.attachWheelHandler(this.wheelHandler);

        if(this.formulas.length===0){
          this.addFormula();
        }
      },
      render : function(){
        var configPanel = this.el.find("#configuration");
        var formulasPanel = this.el.find("#formulas");
        var vizPanel = this.el.find("#visualization");

        configPanel.append(this.configView.render().el);
        vizPanel.append(this.graphView.render().el); 
        this.appendAllFormulas();
      }, 
      addFormula : function(){
        this.formulas.create();
      }, 
      appendFormula : function(f){
        var fForm = new FormulaView({
              model: f
            });
        this.el.find("#formulasList").append(fForm.render().el);
      },
      appendAllFormulas : function(){
        this.formulas.each(this.appendFormula); 
      },
      hideShowPanel : function(e){
        var src = e.target,
            target = src.dataset.for,
            openPanel = $(".panel:visible");
        if(openPanel.length === 1 && openPanel.attr("id") === target){
          openPanel.hide();
        } else{
          openPanel.hide();
          $("#"+target).show();
        }
      },
      wheelHandler : function(delta, pos){
        var scale = 1 + (delta / 1000),
            xmin = this.config.get('Xmin'),
            ymin = this.config.get('Ymin'),
            xmax = this.config.get('Xmax'),
            ymax = this.config.get('Ymax'),
            vT = {
              i : xmin + pos.x * (xmax - xmin) ,
              j : ymin + pos.y * (ymax - ymin) 
            },
            newConfig = {
              Xmin : (this.config.get('Xmin') - vT.i) * scale + vT.i,
              Xmax : (this.config.get('Xmax') - vT.i) * scale + vT.i,
              Ymin : (this.config.get('Ymin') - vT.j) * scale + vT.j, 
              Ymax : (this.config.get('Ymax') - vT.j) * scale + vT.j,
            };
        this.config.set(newConfig);
      }
    }); 
  var app = new AppView();
})(jQuery, 
  [
  "blue",
  "red",
  "green",
  "grey"
  ]
    
  );
