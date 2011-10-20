$(function(){

  // Bucket Model
  // ----------

  window.Bucket = Backbone.RelationalModel.extend({
    defaults: function() {
      return {
      };
    },

    relations: [{
      type: Backbone.HasMany,
      key: 'companies',
      relatedModel: 'Company',
      collectionType: 'CompanyList',
      includeInJSON: Backbone.Model.prototype.idAttribute,
      reverseRelation: {
        key: 'bucket'
      }
    }]
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
      this._companyViews = {};
      $(this.el).addClass("bucket-item");
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
      this.model.bind('add:companies', this.addCompany, this);
      this.model.bind('remove:companies', this.removeCompany, this);
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
      var bucket = this.model.get("bucket");
      bucket.save();
      //bucket.get("companies").remove(this.model);
      //bucket.get("companies").add(this.model);
      $(this.el).removeClass("editing-bucket");
    },

    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    addCompany: function(company) {
      var view = new CompanyView({model: company});
      this._companyViews[company.cid] = view;
      this.$('ul.bucket-companies').append(view.render().el);
    },

    removeCompany: function(company) {
      this._companyViews[company.cid].remove();
    },

    addCompanies: function(company) {
      var that = this;
      var col = this.model.get("companies"); 
      if (col.length == 0) return;
      col.each(function(company) {
        var updatedCompany = Companies.getByCid(company.cid);
        that.addCompany(updatedCompany);
      });
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

  window.Company = Backbone.RelationalModel.extend({
    defaults: function() {
      return {
        favorite:  false,
        order: Companies.nextOrder()
      };
    },

    toggle: function() {
      this.save({favorite: !this.get("favorite")});
    },

    addToBucket: function(bucket_el) { 
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
      console.log("saved");
      console.log(this.model.get("text"));
      $(this.el).removeClass("editing-company");
    },

    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    addToBucket: function(bucket_el) {
      $(bucket_el).append(this.el);
    },

    remove: function() {
      $(this.el).remove();
    },

    clear: function() {
      var bucket = this.model.get("bucket");
      bucket.get("companies").remove(this.model.id);
      bucket.save();
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

      Buckets.bind('add',   this.addBucket, this);
      Buckets.bind('reset', this.addBuckets, this);
      Buckets.bind('all',   this.render, this);

      Companies.fetch();
      Buckets.fetch();

      if (Buckets.length == 0) {
        Buckets.create({name: "Interested"});
        Buckets.create({name: "Waiting"});
        Buckets.create({name: "Interviewing"});
        Buckets.create({name: "Received Offer"});
      }

      // FIXME: For some reason, re-loading data from
      // localStorage makes empty collections into arrays,
      // so transform them back into empty collections so
      // we don't break on method calls

      $("ul.bucket-companies").sortable({
        dropOnEmpty: true,
        connectWith: "ul.bucket-companies"
      });
    },

    addBucket: function(bucket) {
      var view = new BucketView({model: bucket});
      this.$("#bucket-list").append(view.render().el);
      view.addCompanies();
    },

    addBuckets: function() {
      Buckets.each(this.addBucket);
    },

    createOnEnter: function(e) {
      var text = this.input.val();
      if (!text || e.keyCode != 13) return;
      var company = Companies.create({text: text}); 
      var initialBucket = Buckets.at(0);
      console.log(initialBucket.get("name"));
      company.set({"bucket": initialBucket.id });
      company.get("bucket").save();
      this.input.val('');
    }
  });

  window.App = new AppView;

});
