const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  startDate: { type: Date },
  endDate: { type: Date },
  sprintNotes: { type: String } 
});
const Sprint = mongoose.model('Sprint', sprintSchema);

const appSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});
const App = mongoose.model('App', appSchema);

const storySchema = new mongoose.Schema({
  storyId: { type: String, required: true, unique: true }, 
  storyName: { type: String, required: true },             
  sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  releaseTag: { type: String }, 
  storyPoints: { type: Number },
  comments: { type: String },
  epic: { type: String },
  category: { type: String },
  type: { type: String }, 
  responsibility: { type: String }, 
  firstReview: { type: String }, 
  qaEnvRelDate: { type: Date }, 
  status: { type: String, default: 'Pending' }, 
  liveEnvRelease: { type: Date }, 
  appsToBeDeployed: [{ type: String }],
  
  linkedApps: [{
    appRef: { type: mongoose.Schema.Types.ObjectId, ref: 'App' },
    featureBranches: [{ type: String }], 
    baseBranch: { type: String },
    dependencies: { type: String },
    notes: { type: String },
  }]
}, { timestamps: true });

const Story = mongoose.model('Story', storySchema);

const releaseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  releaseDate: { type: Date },
  category: { type: String },
  appsToBeDeployed: [{ type: String }] 
}, { timestamps: true });

const Release = mongoose.model('Release', releaseSchema);

module.exports = { Sprint, App, Story, Release};