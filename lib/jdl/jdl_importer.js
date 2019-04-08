/** Copyright 2013-2018 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see http://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const { uniqBy } = require('lodash');
const Reporter = require('../linter/reporter');
const { getIssuesPerLevel } = require('../linter/issues/issues_helper');
const JDLReader = require('../reader/jdl_reader');
const DocumentParser = require('../parser/document_parser');
const EntityParser = require('../parser/entity_parser');
const JHipsterApplicationExporter = require('../export/jhipster_application_exporter');
const JHipsterDeploymentExporter = require('../export/jhipster_deployment_exporter');
const JHipsterEntityExporter = require('../export/jhipster_entity_exporter');
const BusinessErrorChecker = require('../exceptions/business_error_checker');
const { ERROR } = require('../linter/rule_levels');

/**
 * This class' purpose is to import one, or several JDL files, and export them to JSON (entities & applications).
 * This class is recommended over the use of JDLReader, DocumentParser and the like as it uses them to parse
 * and export JDL files instead of having to use each class separately.
 */
class JDLImporter {
  /**
   * Creates a new JDLImporter class.
   * @param files an iterable having the JDL files
   * @param configuration an object having for keys:
   *   - applicationName: DEPRECATED - the application's name, optional if parsing applications
   *   - applicationType: DEPRECATED - the application type, same remark
   *   - databaseType: DEPRECATED - the database type, same remark
   *   - generatorVersion: DEPRECATED - the generator's version, same remark
   *   - forceNoFiltering: DEPRECATED - whether to force filtering
   *
   *   - application {object}
   *     - name: {string} the application's name, optional if parsing applications
   *     - type: {string} the application type, optional if parsing applications
   *     - databaseType: {string} the database type, optional if parsing applications
   *     - generatorVersion: {string} the generator's version, same remark
   *     - forceNoFiltering: {boolean} whether to force filtering
   *   - analysis {object}
   *     - performAnalysis: {boolean} whether to perform the JDL analysis
   *     - failOnErrors: {boolean} whether the import shouldn't proceed on errors
   */
  constructor(files, configuration) {
    if (!files) {
      throw new Error('JDL files must be passed so as to be imported.');
    }
    this.files = files;
    this.configuration = configuration || {
      application: {},
      analysis: {}
    };
    this.importState = {
      exportedApplications: [],
      exportedEntities: [],
      exportedDeployments: []
    };
  }

  /**
   * Processes JDL files and converts them to JSON.
   * @returns the state of the process:
   *          - exportedDeployments: the exported deployments, or an empty list
   *          - exportedApplications: the exported applications, or an empty list
   *          - exportedEntities: the exported entities, or an empty list
   */
  import() {
    if (this.configuration.analysis && this.configuration.analysis.performAnalysis) {
      performAnalysis(this.files, this.configuration.analysis.failOnErrors);
    }
    const parsedJDLContent = parseFiles(this.files);
    const jdlObject = getJDLObject(parsedJDLContent, this.configuration);
    checkForErrors(jdlObject, this.configuration);
    if (jdlObject.getApplicationQuantity() === 0 && Object.keys(jdlObject.entities).length > 0) {
      this.importState.exportedEntities = importOnlyEntities(jdlObject, this.configuration);
    } else if (jdlObject.getApplicationQuantity() === 1) {
      this.importState = importOneApplicationAndEntities(jdlObject, this.configuration);
    } else {
      this.importState = importApplicationsAndEntities(jdlObject, this.configuration);
    }
    if (jdlObject.getDeploymentQuantity()) {
      this.importState.exportedDeployments = importDeployments(jdlObject.deployments);
    }
    return this.importState;
  }
}

/**
 * Performs an analysis on all the files.
 * @param files fhe files to analyse.
 * @param throwOnErrors whether to throw if the report contains error-level issues.
 * @throws Error if the analysis' report contains an error.
 */
function performAnalysis(files, throwOnErrors) {
  const reporter = new Reporter(files);
  reporter.analyzeFiles();
  const issuesPerLevel = getIssuesPerLevel(reporter.getIssues());
  if (throwOnErrors && issuesPerLevel[ERROR].length !== 0) {
    throw Error(issuesPerLevel);
  }
}

function parseFiles(files) {
  return JDLReader.parseFromFiles(files);
}

function getJDLObject(parsedJDLContent, configuration) {
  return DocumentParser.parseFromConfigurationObject({
    document: parsedJDLContent,
    applicationType: configuration.applicationType,
    applicationName: configuration.applicationName,
    generatorVersion: configuration.generatorVersion
  });
}

function checkForErrors(jdlObject, configuration) {
  const errorChecker = new BusinessErrorChecker(jdlObject, {
    applicationType: configuration.applicationType,
    databaseType: configuration.databaseType
  });
  errorChecker.checkForErrors();
}

function importOnlyEntities(jdlObject, configuration) {
  const jsonEntities = getJSONEntities(jdlObject, configuration);
  return exportJSONEntities(jsonEntities, configuration);
}

function importOneApplicationAndEntities(jdlObject, configuration) {
  const importState = {
    exportedApplications: [],
    exportedEntities: [],
    exportedDeployments: []
  };
  const application = jdlObject.applications[Object.keys(jdlObject.applications)[0]];
  importState.exportedApplications.push(JHipsterApplicationExporter.exportApplication(application));
  if (jdlObject.getEntityQuantity() !== 0) {
    const jsonEntities = getJSONEntities(jdlObject, application.config);
    importState.exportedEntities = uniqBy(
      [
        ...importState.exportedEntities,
        ...exportJSONEntitiesInApplications(jsonEntities, configuration, jdlObject.applications)
      ],
      'name'
    );
  }
  return importState;
}

function importApplicationsAndEntities(jdlObject, configuration) {
  const importState = {
    exportedApplications: [],
    exportedEntities: [],
    exportedDeployments: []
  };
  importState.exportedApplications = JHipsterApplicationExporter.exportApplications(jdlObject.applications);
  if (jdlObject.getEntityQuantity() !== 0) {
    jdlObject.forEachApplication(application => {
      const jsonEntities = getJSONEntities(jdlObject, application.config);
      importState.exportedEntities = uniqBy(
        [
          ...importState.exportedEntities,
          ...exportJSONEntitiesInApplications(jsonEntities, configuration, jdlObject.applications)
        ],
        'name'
      );
    });
  }
  return importState;
}

function importDeployments(deployments) {
  return JHipsterDeploymentExporter.exportDeployments(deployments);
}

function getJSONEntities(jdlObject, configuration) {
  return EntityParser.parse({
    jdlObject,
    applicationType: configuration.applicationType,
    databaseType: configuration.databaseType
  });
}

function exportJSONEntities(entities, configuration) {
  return JHipsterEntityExporter.exportEntities({
    entities,
    forceNoFiltering: configuration.forceNoFiltering,
    application: {
      name: configuration.applicationName,
      type: configuration.applicationType
    }
  });
}

function exportJSONEntitiesInApplications(entities, configuration, applications) {
  return JHipsterEntityExporter.exportEntitiesInApplications({
    entities,
    forceNoFiltering: configuration.forceNoFiltering,
    applications
  });
}

module.exports = JDLImporter;
