$(function(){

  // Bucket Model
  // ----------

  window.Bucket = Backbone.Model.extend({
    defaults: function() {
      return {
        companies: []
      };
    },

    addCompany: function(companyId) {
      var arr = this.get("companies");
      arr.push(companyId);
      this.set({"companies": arr}, {silent: true});
      this.save();
      this.trigger("add:companies", Companies.get(companyId));
    },

    removeCompany: function(companyId) {
      var arr = this.get("companies");
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] == companyId) { 
          arr.splice(i, 1); 
          this.set({"companies": arr}, {silent: true});
          this.save();
          this.trigger("remove:companies", Companies.get(companyId));
        }
      }
    },

    getCompanies: function() {
      return _.map(this.get("companies"), function(companyId) {
        return Companies.get(companyId);
      });
    }
  });

  // Bucket Collection
  // ---------------

  window.BucketList = Backbone.Collection.extend({
    model: Bucket,

    localStorage: new Store("buckets")
  });

  window.Buckets = new BucketList();

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
      this.render();
      this.model.bind('change', this.setText, this);
      this.model.bind('destroy', this.remove, this);
      this.model.bind('add:companies', this.addCompany, this);
      this.model.bind('remove:companies', this.removeCompany, this);
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setText();

      var that = this;
      this.$("ul.bucket-companies").sortable({
        dropOnEmpty: true,
        connectWith: "ul.bucket-companies",
        receive: function(event, ui) {
          var bucket = that.model;
          var id = $(ui.item[0]).attr("id"); 
          var company = Companies.get(id);
          var oldBucket = company.getBucket();

          company.setBucket(bucket.id);
          oldBucket.removeCompany(company.id);
          bucket.addCompany(company.id);
        }
      });

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
      this.model.save({name: this.input.val()});
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
      var company = this._companyViews[company.cid];
      company.remove();
    },

    addCompanies: function(company) {
      var that = this;
      var col = this.model.getCompanies(); 
      if (col.length == 0) return;
      _.each(col, function(company) {
        that.addCompany(company);
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

  window.Company = Backbone.Model.extend({
    defaults: function() {
      return {
        favorite:  false,
        mood: 0,
        bucket: 0,
        order: Companies.nextOrder()
      };
    },

    toggle: function() {
      this.save({favorite: !this.get("favorite")});
    },

    getBucket: function() {
      return Buckets.get(this.get("bucket"));
    },

    setBucket: function(bucketId) {
      this.save({bucket: bucketId}, {silent: true});
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

  window.Companies = new CompanyList();

  // Company Item View
  // --------------

  window.CompanyView = Backbone.View.extend({
    tagName:  "li",

    template: _.template($('#item-template').html()),

    events: {
      "click span.company-text"    : "edit",
      "click span.company-destroy"   : "clear",
      "click span.company-mood"   : "changeMood",
      "keypress .company-input"      : "updateOnEnter"
    },

    initialize: function() {
      $(this.el).addClass("company-item");
      $(this.el).attr("id", this.model.id);
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);

    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setText();
      this.setMood();
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

    addToBucket: function(bucket_el) {
      $(bucket_el).append(this.el);
    },

    changeMood: function() {
      this.model.save({mood: (this.model.get("mood") + 1) % 3});
      this.setMood();
    },

    setMood: function() {
      var newMood = this.model.get("mood");
      var moodElement = this.$('.mood');
      switch(newMood) {
        case 0: // Neutral
          moodElement.removeClass("sad");
          break;
        case 1: // Happy
          moodElement.addClass("happy");
          break;
        case 2: // Sad
          moodElement.removeClass("happy");
          moodElement.addClass("sad");
          break;
      }
    },

    remove: function() {
      $(this.el).remove();
    },

    clear: function() {
      var bucket = this.model.getBucket();
      bucket.removeCompany(this.model.id);
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

      Companies.fetch();
      Buckets.fetch();

      if (Buckets.length == 0) {
        Buckets.create({name: "Interested"});
        Buckets.create({name: "Waiting"});
        Buckets.create({name: "Interviewing"});
        Buckets.create({name: "Received Offer"});
      }
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
      var initialBucket = Buckets.at(0);
      var company = Companies.create({text: text}); 
      company.setBucket(initialBucket.id);
      initialBucket.addCompany(company.id);
      this.input.val('');
    }
  });

  window.App = new AppView();

});
