$(function(){

  // Bucket Model
  // ----------

  window.Bucket = Backbone.Model.extend({
    defaults: function() {
      return {
      };
    },
  });

  // Bucket Collection
  // ---------------

  window.BucketList = Backbone.Collection.extend({
    model: Bucket,

    localStorage: new Store("buckets")
  });

  window.Buckets = new BucketList;

  // Bucket Item View
  // --------------

  window.BucketView = Backbone.View.extend({
    tagName:  "li",

    template: _.template($('#bucket-template').html()),

    events: {
      "click span.bucket-name"    : "edit",
      "click span.bucket-destroy"   : "clear",
      "keypress .bucket-input"      : "updateOnEnter"
    },

    initialize: function() {
      $(this.el).addClass("bucket-item");
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setText();
      return this;
    },

    setText: function() {
      var name = this.model.get('name');
      this.$('.bucket-name').text(name);
      this.input = this.$('.bucket-input');
      this.input.bind('blur', _.bind(this.close, this)).val(name);
    },

    toggleFavorite: function() {
      this.model.toggle();
    },

    edit: function() {
      $(this.el).addClass("editing-bucket");
      this.input.focus();
    },

    close: function() {
      this.model.save({text: this.input.val()});
      $(this.el).removeClass("editing-bucket");
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
      $(this.el).addClass("editing-company");
      this.input.focus();
    },

    close: function() {
      this.model.save({text: this.input.val()});
      $(this.el).removeClass("editing-company");
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

      Companies.bind('add',   this.addCompany, this);
      Companies.bind('reset', this.addCompanies, this);
      Companies.bind('all',   this.render, this);

      Buckets.bind('add',   this.addBucket, this);
      Buckets.bind('reset', this.addBuckets, this);
      Buckets.bind('all',   this.render, this);

      Buckets.create({name: "Interested"});
      Buckets.create({name: "Interviewing"});
      Buckets.create({name: "Received Offer"});
      Buckets.create({name: "Rejected"});

      Companies.fetch();
    },

    addCompany: function(company) {
      var view = new CompanyView({model: company});
      this.$("#company-list").append(view.render().el);
    },

    addCompanies: function() {
      Companies.each(this.addCompany);
    },

    addBucket: function(bucket) {
      var view = new BucketView({model: bucket});
      this.$("#bucket-list").append(view.render().el);
    },

    addBuckets: function() {
      Buckets.each(this.addBucket);
    },

    createOnEnter: function(e) {
      var text = this.input.val();
      if (!text || e.keyCode != 13) return;
      Companies.create({text: text});
      this.input.val('');
    }
  });

  window.App = new AppView;

});
