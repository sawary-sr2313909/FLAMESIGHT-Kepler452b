import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Papa from 'papaparse';
import { DEMOS, known, rankCoverage } from './evidenceCoverage.js';

const read = name => Papa.parse(fs.readFileSync(new URL(`../../NASA_DATA/${name}.csv`, import.meta.url), 'utf8'), {header:true,skipEmptyLines:true}).data;
const studies = read('experiments');
const evidence = read('evidence');
test('public CSV copies preserve authoritative records byte-for-byte', () => {
  for (const name of ['experiments', 'evidence']) assert.deepEqual(fs.readFileSync(new URL(`../../NASA_DATA/${name}.csv`, import.meta.url)), fs.readFileSync(new URL(`../public/data/${name}.csv`, import.meta.url)));
});
test('fabric demo matches Saffire I metadata without certifying applicability', () => {
  const results = rankCoverage(studies,evidence,DEMOS[0]);
  assert.equal(results[0].experiment_id,'SAFFIRE-I');
  assert.equal(results[0].matched,3);
  assert.equal(results[0].conditions[0].status,'Unknown');
  assert.equal(results[0].conditions[3].status,'Unknown');
  assert.ok(results.every(r => !r.sufficient));
});
test('lunar gravity differs; no microgravity extrapolation', () => {
  assert.ok(rankCoverage(studies,evidence,DEMOS[2]).every(r => r.conditions[2].status === 'Different'));
});
test('missing airflow never becomes zero and blank scenarios never match', () => {
  const zero = rankCoverage(studies,evidence,{...DEMOS[0],airflow:'0'});
  assert.equal(zero.find(r => r.experiment_id === 'FLEX').conditions[4].status,'Unknown');
  const blank = rankCoverage(studies,evidence,{component:'',material:'',gravity:'',oxygen:'',airflow:''});
  assert.ok(blank.every(r => r.matched === 0));
  assert.equal(known('N/A'),false);
  assert.equal(known('0'),true);
});
test('material mentions retain objective/result distinction and unknown mixed materials', () => {
  const result = rankCoverage(studies,evidence,DEMOS[1]);
  assert.equal(result.find(r => r.experiment_id === 'SAFFIRE-IV').conditions[1].status,'Unknown');
  assert.equal(result.find(r => r.experiment_id === 'SoFIE-MIST').records[0].evidence_type,'Research Objective');
  assert.equal(result.find(r => r.experiment_id === 'FLEX').conditions[1].status,'Different');
});
