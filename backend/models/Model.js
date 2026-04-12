const mongoose = require("mongoose");

// Sprint is the planning container.
// One sprint can have many stories (linked from Story.sprint).
const sprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  sprintNotes: {
    type: String,
  },
});

// Creates/uses the "sprints" collection.
const Sprint = mongoose.model("Sprint", sprintSchema);

// Story is the core work item entity used across sprint, release, and app views.
// Relationship summary:
// 1) Story -> Sprint: many-to-one via ObjectId reference in `sprint`.
// 2) Story -> Release: soft link via `releaseTag` string (release name), not ObjectId.
// 3) Story -> Apps: embedded array `linkedApps`, each entry stores app-specific branch metadata.
const storySchema = new mongoose.Schema(
  {
    storyId: {
      type: String,
      required: true,
      unique: true,
    },
    storyName: {
      type: String,
      required: true,
    },
    // Foreign key reference to Sprint document (_id).
    // This enables populate("sprint", "name") in controllers for readable sprint info.
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sprint",
    },
    releaseTag: {
      type: String,
    },
    storyPoints: {
      type: Number,
    },
    comments: {
      type: String,
    },
    epic: {
      type: String,
    },
    category: {
      type: String,
    },
    type: {
      type: String,
    },
    responsibility: {
      type: String,
    },
    firstReview: {
      type: String,
    },
    qaEnvRelDate: {
      type: Date,
    },
    status: {
      type: String,
    },
    liveEnvRelease: {
      type: Date,
    },
    appsToBeDeployed: [
      {
        type: String,
      },
    ],
    // Embedded subdocuments for app integration details tied to this story.
    // Kept embedded because these fields are edited/read together with story detail.
    linkedApps: [
      {
        appName: {
          type: String,
          required: true,
        },
        featureBranch: {
          type: String,
        },
        baseBranch: {
          type: String,
        },
        dependencies: {
          type: String,
        },
        notes: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Story = mongoose.model("Story", storySchema);

// Release stores release metadata used by release list/detail pages.
// Story linkage is performed through Story.releaseTag matching Release.name.
const releaseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    releaseDate: {
      type: Date,
    },
    devCutoff: {
      type: Date,
    },
    qaSignoff: {
      type: Date,
    },
    category: {
      type: String,
    },
    appsToBeDeployed: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Release = mongoose.model("Release", releaseSchema);

// Export models so controllers can compose read/write flows across entities.
module.exports = {
  Sprint,
  Story,
  Release,
};
