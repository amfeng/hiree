(function(Company) {
  var app = hiree.app;

  Company.Model = function() {
    initialize: function() {
    },
    defaults: {
      status: "interested",
      priority: "high"
    }
  }

  Company.List = Backbone.Collection.extend({
    model: Company.Model
  });
})(chat.module("company"));
