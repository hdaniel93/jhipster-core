/**
 * Copyright 2013-2018 the original author or authors from the JHipster project.
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

const JDLIssueChecker = require('./jdl_issue_checker');

/**
 * The reporter class is responsible for launching an analysis of JDL files, and report back any encountered issue.
 */
class Reporter {
  /**
   * Builds a new Reporter.
   * @param {Array} files the files to analyse.
   */
  constructor(files) {
    this.files = files || [];
    this.issuesPerFiles = null;
    this.totalNumberOfIssues = 0;
  }

  /**
   * Launch a file analysis.
   */
  analyzeFiles() {
    this.issuesPerFiles = new Map();
    this.files.forEach(file => {
      const issueChecker = new JDLIssueChecker({ filePath: file });
      const issues = issueChecker.check();
      this.issuesPerFiles.set(file, issues);
      this.totalNumberOfIssues += issues.getSize();
    });
  }

  /**
   * Returns all the issues.
   * @throws {Error} If no analysis has been performed prior to calling this method.
   * @returns {Array} all the issues.
   */
  getIssues() {
    if (!this.issuesPerFiles) {
      throw new Error('The files must be analyzed before getting any result.');
    }
    let issues = [];
    this.issuesPerFiles.forEach(fileIssues => {
      issues = issues.concat(fileIssues.getIssues());
    });
    return issues;
  }

  /**
   * Returns all the file issues.
   * @throws {Error} If no analysis has been performed prior to calling this method.
   * @returns {Object} all the file issues.
   */
  geIssuesPerFiles() {
    if (!this.issuesPerFiles) {
      throw new Error('The files must be analyzed before getting any result.');
    }
    const issuesPerFiles = {};
    this.issuesPerFiles.forEach((fileIssues, file) => {
      issuesPerFiles[file] = fileIssues;
    });
    return issuesPerFiles;
  }

  /**
   * Returns the number of issues regardless of the level or the file.
   * @throws {Error} If no analysis has been performed prior to calling this method.
   * @returns {number} the number of issues.
   */
  getNumberOfIssues() {
    if (!this.issuesPerFiles) {
      throw new Error('The files must be analyzed before getting any result.');
    }
    return this.totalNumberOfIssues;
  }
}

module.exports = Reporter;
