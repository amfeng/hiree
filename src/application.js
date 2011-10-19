$(function(){

  // Company Model
  // ----------

  window.Company = Backbone.Model.extend({
    defaults: function() {
      return {
        favorite:  false,
        order: Companies.nextOrder()
      };
    },

    toggle: function() {
      this.save({favorite: !this.get("favorite")});
    }

  });

  // Company Collection
  // ---------------

  window.CompanyList = Backbone.Collection.extend({
    model: Company,

    localStorage: new Store("companies"),

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: function(todo) {
      return todo.get('order');
    }

  });

  window.Companies = new CompanyList;

  // Company Item View
  // --------------

  // The DOM element for a todo item...
  window.CompanyView = Backbone.View.extend({
    tagName:  "li",

    template: _.template($('#item-template').html()),

    events: {
      "click span.company-text"    : "edit",
      "click span.company-destroy"   : "clear",
      "keypress .company-input"      : "updateOnEnter"
    },

    initialize: function() {
      $(this.el).addClass("company-item");
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setText();
      return this;
    },

    setText: function() {
      var text = this.model.get('text');
      this.$('.company-text').text(text);
      this.input = this.$('.company-input');
      this.input.bind('blur', _.bind(this.close, this)).val(text);
    },

    toggleFavorite: function() {
      this.model.toggle();
    },

    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    close: function() {
      this.model.save({text: this.input.val()});
      $(this.el).removeClass("editing");
    },

    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    remove: function() {
      $(this.el).remove();
    },

    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  window.AppView = Backbone.View.extend({
    el: $("#hireeapp"),

    events: {
      "keypress #new-company":  "createOnEnter",
    },

    initialize: function() {
      this.input    = this.$("#new-company");

      Companies.bind('add',   this.addOne, this);
      Companies.bind('reset', this.addAll, this);
      Companies.bind('all',   this.render, this);

      Companies.fetch();
    },

    addOne: function(todo) {
      var view = new CompanyView({model: todo});
      this.$("#company-list").append(view.render().el);
    },

    addAll: function() {
      Companies.each(this.addOne);
    },

    createOnEnter: function(e) {
      var text = this.input.val();
      if (!text || e.keyCode != 13) return;
      Companies.create({text: text});
      this.input.val('');
    }
  });

  // Finally, we kick things off by creating the **App**.
  window.App = new AppView;

});
