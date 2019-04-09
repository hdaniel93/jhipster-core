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

const expect = require('chai').expect;
const Issues = require('../../../../lib/linter/issues/issues');
const { RuleNames } = require('../../../../lib/linter/rules');
const EntityIssue = require('../../../../lib/linter/issues/entity_issue');
const FieldIssue = require('../../../../lib/linter/issues/field_issue');
const EnumIssue = require('../../../../lib/linter/issues/enum_issue');

describe('Issues', () => {
  describe('addEntityIssue', () => {
    let issues;
    let issue;

    before(() => {
      issues = new Issues();
      issue = new EntityIssue({ entityName: 'Toto', ruleName: RuleNames.ENT_DUPLICATED });
      issues.addEntityIssue(issue);
    });

    it('adds a new issue', () => {
      expect(issues.getIssues()).to.deep.equal([issue]);
    });
    it('increments the size', () => {
      expect(issues.getSize()).to.equal(1);
    });
  });
  describe('addFieldIssue', () => {
    let issues;
    let issue;

    before(() => {
      issues = new Issues();
      issue = new FieldIssue({ fieldName: 'Toto', entityName: 'Tata', ruleName: RuleNames.FLD_DUPLICATED });
      issues.addFieldIssue(issue);
    });

    it('adds a new issue', () => {
      expect(issues.getIssues()).to.deep.equal([issue]);
    });
    it('increments the size', () => {
      expect(issues.getSize()).to.equal(1);
    });
  });
  describe('addEnumIssue', () => {
    let issues;
    let issue;

    before(() => {
      issues = new Issues();
      issue = new EnumIssue({ enumName: 'Toto', ruleName: RuleNames.ENUM_DUPLICATED });
      issues.addEnumIssue(issue);
    });

    it('adds a new issue', () => {
      expect(issues.getIssues()).to.deep.equal([issue]);
    });
    it('increments the size', () => {
      expect(issues.getSize()).to.equal(1);
    });
  });
  describe('getEntityIssuesForEntityName', () => {
    context('when not having any issue', () => {
      it('returns an empty array', () => {
        expect(new Issues().getEntityIssuesForEntityName('A')).to.have.lengthOf(0);
      });
    });
    context('when having issues', () => {
      let issues = null;

      before(() => {
        issues = new Issues();
        issues.addEntityIssue(new EntityIssue({ ruleName: 'Toto', entityName: 'A' }));
        issues.addEntityIssue(new EntityIssue({ ruleName: 'Titi', entityName: 'A' }));
        issues.addEntityIssue(new EntityIssue({ ruleName: 'Titi', entityName: 'B' }));
      });

      it('returns them', () => {
        expect(issues.getEntityIssuesForEntityName('A')).to.have.lengthOf(2);
        expect(
          issues
            .getEntityIssuesForEntityName('A')
            .map(issue => issue.ruleName)
            .join(', ')
        ).to.equal('Toto, Titi');
      });
    });
  });
  describe('getFieldIssuesForFieldName', () => {
    context('when not having any issue', () => {
      it('returns an empty array', () => {
        expect(new Issues().getFieldIssuesForFieldName('A')).to.have.lengthOf(0);
      });
    });
    context('when having issues', () => {
      let issues = null;

      before(() => {
        issues = new Issues();
        issues.addFieldIssue(new FieldIssue({ ruleName: 'Toto', fieldName: 'a', entityName: 'A' }));
        issues.addFieldIssue(new FieldIssue({ ruleName: 'Titi', fieldName: 'a', entityName: 'A' }));
      });

      it('returns them', () => {
        expect(issues.getFieldIssuesForFieldName('a')).to.have.lengthOf(2);
        expect(
          issues
            .getFieldIssuesForFieldName('a')
            .map(issue => issue.ruleName)
            .join(', ')
        ).to.equal('Toto, Titi');
      });
    });
  });
  describe('getEnumIssuesForEnumName', () => {
    context('when not having any issue', () => {
      it('returns an empty array', () => {
        expect(new Issues().getEnumIssuesForEnumName('A')).to.have.lengthOf(0);
      });
    });
    context('when having issues', () => {
      let issues = null;

      before(() => {
        issues = new Issues();
        issues.addEnumIssue(new EnumIssue({ ruleName: 'Toto', enumName: 'A' }));
        issues.addEnumIssue(new EnumIssue({ ruleName: 'Titi', enumName: 'A' }));
      });

      it('returns them', () => {
        expect(issues.getEnumIssuesForEnumName('A')).to.have.lengthOf(2);
        expect(
          issues
            .getEnumIssuesForEnumName('A')
            .map(issue => issue.ruleName)
            .join(', ')
        ).to.equal('Toto, Titi');
      });
    });
  });
  describe('getIssues', () => {
    describe('when there are no issues', () => {
      let issues;

      before(() => {
        issues = new Issues();
      });

      it('returns an empty list', () => {
        expect(issues.getIssues()).to.deep.equal([]);
      });
    });
    describe('when there are some issues', () => {
      let issues;
      let issue1;
      let issue2;

      before(() => {
        issues = new Issues();
        issue1 = new FieldIssue({ fieldName: 'Toto', entityName: 'Tata', ruleName: RuleNames.FLD_DUPLICATED });
        issue2 = new FieldIssue({ fieldName: 'Tutu', entityName: 'Tata', ruleName: RuleNames.FLD_DUPLICATED });
        issues.addFieldIssue(issue1);
        issues.addFieldIssue(issue2);
      });

      it('returns a list containing the issues', () => {
        expect(issues.getIssues()).to.deep.equal([issue1, issue2]);
      });
    });
  });
  describe('getSize', () => {
    describe('when there are no issues', () => {
      let issues;

      before(() => {
        issues = new Issues();
      });

      it('returns 0', () => {
        expect(issues.getSize()).to.equal(0);
      });
    });
    describe('when there are some issues', () => {
      let issues;
      let issue1;
      let issue2;

      before(() => {
        issues = new Issues();
        issue1 = new FieldIssue({ fieldName: 'Toto', entityName: 'Tata', ruleName: RuleNames.FLD_DUPLICATED });
        issue2 = new FieldIssue({ fieldName: 'Tutu', entityName: 'Tata', ruleName: RuleNames.FLD_DUPLICATED });
        issues.addFieldIssue(issue1);
        issues.addFieldIssue(issue2);
      });

      it('returns the number of elements in the container', () => {
        expect(issues.getSize()).to.equal(2);
      });
    });
  });
});
