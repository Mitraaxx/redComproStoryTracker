// Configure module imports and exports for this file.
export const PR_BASE_BRANCHES = [{
  label: "env/thor",
  value: "env/thor"
}, {
  label: "env/qa",
  value: "env/qa"
}, {
  label: "env/release",
  value: "env/release"
}];
export const ITEMS_PER_PAGE = 15;
export const STATUS_MEMBERS = ["Asad", "CQA", "Kamakshi", "MQA", "Namrata", "Nishant", "Paras", "Released", "Sahil", "Sidharth", "Sushil"];
export const TEAM_MEMBERS = ["Asad", "Kamakshi", "Namrata", "Nishant", "Paras", "Sahil", "Sidharth", "Sushil"];
export const repoConfig = {
  "c1-2023": {
    baseUrl: "https://github.com/comprodls/c1-2023/compare/",
    orgName: "comprodls",
    repoName: "c1-2023",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "env/release",
      master: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "c1-2024": {
    baseUrl: "https://github.com/comprodls/c1-2024/compare/",
    orgName: "comprodls",
    repoName: "c1-2024",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "env/release",
      master: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "contentful-testbench": {
    baseUrl: "https://github.com/compro-cup-central/contentful-testbench/compare/",
    orgName: "compro-cup-central",
    repoName: "contentful-testbench",
    envBranches: {
      thor: "develop",
      rel: "master"
    }
  },
  "cup-content-testbench": {
    baseUrl: "https://github.com/comprodls/cup-content-testbench/compare/",
    orgName: "comprodls",
    repoName: "cup-content-testbench",
    envBranches: {
      thor: "generic-content-develop",
      rel: "generic-content-develop"
    }
  },
  "HALO-APP-Speech-Dialogue": {
    baseUrl: "https://github.com/ELTTechnology/HALO-APP-Speech-Dialogue/compare/",
    orgName: "ELTTechnology",
    repoName: "HALO-APP-Speech-Dialogue",
    envBranches: {
      thor: "dev",
      qa: "qa",
      rel: "release/all",
      master: "master"
    }
  },
  "HALO-APP-Speech-Vocabulary": {
    baseUrl: "https://github.com/ELTTechnology/HALO-APP-Speech-Vocabulary/compare/",
    orgName: "ELTTechnology",
    repoName: "HALO-APP-Speech-Vocabulary",
    envBranches: {
      thor: "dev",
      qa: "qa",
      rel: "release/all",
      master: "master"
    }
  },
  "HALO-lambda-authorizer": {
    baseUrl: "https://github.com/ELTTechnology/HALO-lambda-authorizer/compare/",
    orgName: "ELTTechnology",
    repoName: "HALO-lambda-authorizer",
    envBranches: {
      thor: "dev",
      qa: "qa",
      rel: "release/all",
      master: "main"
    }
  },
  ispai: {
    baseUrl: "https://github.com/ELTTechnology/ispai/compare/",
    orgName: "ELTTechnology",
    repoName: "ispai",
    envBranches: {
      thor: "main",
      qa: "env/qa",
      rel: "env/release",
      master: "env/prod",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "libs-adv-cross-product-aggregations": {
    baseUrl: "https://github.com/comprodls/libs-adv-cross-product-aggregations/compare/",
    orgName: "comprodls",
    repoName: "libs-adv-cross-product-aggregations",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "main"
    }
  },
  "libs-content-helper": {
    baseUrl: "https://github.com/comprodls/libs-content-helper/compare/",
    orgName: "comprodls",
    repoName: "libs-content-helper",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "master"
    }
  },
  "libs-frontend-basic-chart": {
    baseUrl: "https://github.com/compro-cup-central/libs-frontend-basic-chart/compare/",
    orgName: "compro-cup-central",
    repoName: "libs-frontend-basic-chart",
    envBranches: {
      thor: "dev",
      qa: "qa",
      rel: "master"
    }
  },
  "libs-frontend-xapi": {
    baseUrl: "https://github.com/comprodls/libs-frontend-xapi/compare/",
    orgName: "comprodls",
    repoName: "libs-frontend-xapi",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "master"
    }
  },
  "libs-reports-helper": {
    baseUrl: "https://github.com/comprodls/libs-reports-helper/compare/",
    orgName: "comprodls",
    repoName: "libs-reports-helper",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "main"
    }
  },
  "module-app-micro-base": {
    baseUrl: "https://github.com/comprodls/module-app-micro-base/compare/",
    orgName: "comprodls",
    repoName: "module-app-micro-base",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "module-cefr": {
    baseUrl: "https://github.com/compro-cup-central/module-cefr/compare/",
    orgName: "compro-cup-central",
    repoName: "module-cefr",
    envBranches: {
      thor: "dev",
      qa: "qa",
      rel: "master"
    }
  },
  "nemo-micro-admin": {
    baseUrl: "https://github.com/comprodls/nemo-micro-admin/compare/",
    orgName: "comprodls",
    repoName: "nemo-micro-admin",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "env/release",
      master: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "nemo-micro-class": {
    baseUrl: "https://github.com/comprodls/nemo-micro-class/compare/",
    orgName: "comprodls",
    repoName: "nemo-micro-class",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "env/release",
      master: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "nemo-micro-learning-path": {
    baseUrl: "https://github.com/comprodls/nemo-micro-learning-path/compare/",
    orgName: "comprodls",
    repoName: "nemo-micro-learning-path",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "env/release",
      master: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "nemo-micro-nlp": {
    baseUrl: "https://github.com/comprodls/nemo-micro-nlp/compare/",
    orgName: "comprodls",
    repoName: "nemo-micro-nlp",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "env/release",
      master: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "nemo-micro-notifications-component": {
    baseUrl: "https://github.com/comprodls/nemo-micro-notifications-component/compare/",
    orgName: "comprodls",
    repoName: "nemo-micro-notifications-component",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "env/release",
      master: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "nemo-micro-support-admin": {
    baseUrl: "https://github.com/comprodls/nemo-micro-support-admin/compare/",
    orgName: "comprodls",
    repoName: "nemo-micro-support-admin",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "env/release",
      master: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "redComproStoryTracker": {
    baseUrl: "https://github.com/Mitraaxx/redComproStoryTracker/compare/",
    orgName: "Mitraaxx",
    repoName: "redComproStoryTracker",
    envBranches: {
      qa: "env/qa",
      rel: "master"
    }
  },
  "sam-audio-streaming-lyr": {
    baseUrl: "https://github.com/compro-cup-central/sam-audio-streaming-lyr/compare/",
    orgName: "compro-cup-central",
    repoName: "sam-audio-streaming-lyr",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "release/all",
      master: "main",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "sam-contentful-app": {
    baseUrl: "https://github.com/compro-cup-central/sam-contentful-app/compare/",
    orgName: "compro-cup-central",
    repoName: "sam-contentful-app",
    envBranches: {
      thor: "env/dev",
      qa: "env/staging",
      rel: "release/all",
      master: "master"
    }
  },
  "sam-contentful-ilayer": {
    baseUrl: "https://github.com/compro-cup-central/sam-contentful-ilayer/compare/",
    orgName: "compro-cup-central",
    repoName: "sam-contentful-ilayer",
    envBranches: {
      thor: "env/dev",
      qa: "env/qa",
      rel: "release/all",
      master: "master",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "sam-large-reports-lyr": {
    baseUrl: "https://github.com/compro-cup-central/sam-large-reports-lyr/compare/",
    orgName: "compro-cup-central",
    repoName: "sam-large-reports-lyr",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "release/all",
      master: "main",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "sam-sch-notification-layer": {
    baseUrl: "https://github.com/comprodls/sam-sch-notification-layer/compare/",
    orgName: "comprodls",
    repoName: "sam-sch-notification-layer",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "release/all",
      master: "main",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "sam-school-reports-lyr": {
    baseUrl: "https://github.com/comprodls/sam-school-reports-lyr/compare/",
    orgName: "comprodls",
    repoName: "sam-school-reports-lyr",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "release/all",
      master: "main",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "sam-setup-schedules-lyr": {
    baseUrl: "https://github.com/comprodls/sam-setup-schedules-lyr/compare/",
    orgName: "comprodls",
    repoName: "sam-setup-schedules-lyr",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "release/all",
      master: "main",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "service-class-settings-timeseries": {
    baseUrl: "https://github.com/comprodls/service-class-settings-timeseries/compare/",
    orgName: "comprodls",
    repoName: "service-class-settings-timeseries",
    envBranches: {
      thor: "env/thor",
      qa: "env/qa",
      rel: "release/all",
      master: "main",
      alpha: "env/alpha",
      hotfix: "env/hotfix"
    }
  },
  "cypress-automation-c1": {
    baseUrl: "https://github.com/ComproSQA/cypress-automation-c1/compare/",
    orgName: "ComproSQA",
    repoName: "cypress-automation-c1",
    envBranches: {
      thor: "main"
    }
  }
};
