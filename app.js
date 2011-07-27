/* Application jsPlot
 *
 * Based on backbone.js
 * */

(function($){
  
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
        "change input" : "update"
      },
      template : _.template($("#config-template").html()),
      initialize : function(config){
        _.bindAll(this, 'render', 'update');
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
      }
    });


  var GraphView = Backbone.View.extend({
      tagName : 'div',
      events : {
      },
      defaultF : function(){return undefined},
      initialize : function(config, formulas){
        _.bindAll(this, 'render', 'update');
        this.conf = config;
        this.conf.bind("change", this.update);
        this.formulas = formulas;
        this.formulas.bind("change", this.update);
        $(this.el).attr("id", "graph");
      },
      render : function(config){
       return this; 
      },
      update : function(){
       var functions = this.formulas.map(function(f){
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
      scrollHandler : function(e){
        console.log(e);
      }
    });

  var Formula = Backbone.Model.extend({
      defaults:{
        bodyAsString : "x"
      }
    });
  
  var Formulas = Backbone.Collection.extend({
      model: Formula
    });

  var FormulaView = Backbone.View.extend({
      tagName : "li",
      template : _.template($("#formula-template").html()),
      events : {
        "keyup input": "updateBody"
      },
      initialize : function(){
        _.bindAll(this, 'render', 'updateBody');
      },
      render : function(){
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      },
      updateBody :function(){
       var body = $(this.el).find(".formula").attr("value");
       this.model.set({
         bodyAsString : body 
       }); 
      }
  });

  var AppView = Backbone.View.extend({
      el: $("#application"),
      events : {
        "click #addFormula": "addFormula"
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

        window.onmousewheel = this.wheelHandler;
      },
      render : function(){
       var configPanel = this.el.find("#configuration");
       var vizPanel = this.el.find("#visualization");

       configPanel.append(this.configView.render().el)
         .append("<button id='addFormula'>Add formula</button><ul id='formulas'></ul>");
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
        this.el.find("#formulas").append(fForm.render().el);
      },
      wheelHandler : function(e){
        var d = e.wheelDelta / 100; 
        this.config.set({
              Xmin : this.config.get('Xmin') - d,
              Xmax : this.config.get('Xmax') + d,
              Ymin : this.config.get('Ymin') - d, 
              Ymax : this.config.get('Ymax') + d
            });
      }
    }); 
  var app = new AppView();
})(jQuery);
