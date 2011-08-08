/* Application jsPlot
 *
 * Based on backbone.js
 * */

(function($){
  var eventUtils = {
    attachWheelHandler:function(handler){
      var divGraph = document.getElementById("graph");
      var h = function(e){
        var pos = {
          x : e.layerX/this.offsetWidth, 
          y : 1 - e.layerY/this.offsetHeight
        } 
        var d = e.wheelDelta||e.detail;
        handler(d, pos);
      };
      divGraph.addEventListener("mousewheel", h, false);
      divGraph.addEventListener("DOMMouseScroll", h, false);
    }
  };
   
  var Config = Backbone.Model.extend({
      defaults:{
        Xmin : -5,
        Xmax : 5, 
        Ymin : -5,
        Ymax : 5,
        canvasHeight : 600,
        canvasWidth : 800 
      },
      validate: function(attrs){
        if(attrs.Xmin >= attrs.Xmax){
          return "Xmin > Xmax ";
        }
        if(attrs.Ymin >= attrs.Ymax){
          return "Ymin > Ymax ";
        }
      }
    });


  var ConfigView = Backbone.View.extend({
      tagName : 'div',
      events : {
        "keyup input" : "update",
        "change input" : "update",
        "click button.reset" : "reset"
      },
      template : _.template($("#config-template").html()),
      initialize : function(config){
        _.bindAll(this, 'render', 'update', "reset");
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
           newConfig[elt.id]=parseInt(elt.value, 10);
         });
       this.model.set(newConfig);
      }, 
      reset: function(){
       var conf = new Config({
          canvasHeight : this.model.get('canvasHeight'),
          canvasWidth : this.model.get('canvasWidth')
       });
       this.model.set(conf.toJSON()); 
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
        _.bindAll(this, 'render', 'update', 'click', 'onMove', 'proxyMovementHandler');
        this.conf = config;
        this.conf.bind("change", this.update);
        this.formulas = formulas;
        this.formulas.bind("change", this.update);
        $(this.el).attr("id", "graph");
        this.unClick();
      },
      render : function(config){
       return this; 
      },
      update : function(){
       var functions = this.formulas
         .select(function(e){
          return e.get('visible');
         })
         .map(function(f){
          try{
            var f = new Function("x", "return "+f.get("bodyAsString")+";");
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
        console.log(e, "Not initialized");
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
          x:e.offsetX,
          y:e.offsetY
        };
      },
      onNotMove : function(e){
        //"Nope not moving"
      },
      click : function(e){
        console.log(e);
        this.lastState = {
          x:e.layerX,
          y:e.layerY
        };
        this.movementHandler = this.onMove;
      },
      unClick : function(e){
        console.log(e);
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
      model: Formula
    });

  var FormulaView = Backbone.View.extend({
      tagName : "li",
      template : _.template($("#formula-template").html()),
      events : {
        "keyup input": "updateBody",
        "click .visible": "updateBody"
      },
      initialize : function(){
        _.bindAll(this, 'render', 'updateBody');
      },
      render : function(){
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      },
      updateBody :function(){
        $el = $(this.el);
        var body = $el.find(".formula").attr("value");
        var isVisible = $el.find(".visible:checked").length===1;
        this.model.set({
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

        this.configView = new ConfigView(configuration);
        this.graphView = new GraphView(configuration, this.formulas);

        this.render();
        this.addFormula();

        configuration.change();
        eventUtils.attachWheelHandler(this.wheelHandler);
      },
      render : function(){
       var configPanel = this.el.find("#configuration");
       var formulasPanel = this.el.find("#formulas");
       var vizPanel = this.el.find("#visualization");

       configPanel.append(this.configView.render().el);
       formulasPanel.append("<button id='addFormula'>Add formula</button><ul id='formulasList'></ul>");
       vizPanel.append(this.graphView.render().el); 
      }, 
      addFormula : function(){
        var f1 = new Formula();
        this.formulas.add(f1);
      }, 
      appendFormula : function(f){
        var fForm = new FormulaView({
              model: f
            });
        this.el.find("#formulasList").append(fForm.render().el);
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
              Ymax : (this.config.get('Ymax') - vT.j) * scale + vT.j
            };

        this.config.set(newConfig);
      }
    }); 
  var app = new AppView();
})(jQuery);
