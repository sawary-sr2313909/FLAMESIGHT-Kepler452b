import test from 'node:test';
import assert from 'node:assert/strict';
import { componentFromObject, createCabinModel, FINISHES, partGeometry, ZONE_INFO } from './cabinModel.js';

test('Spline object events map only to the four illustrative interface zones',()=>{
  for(const zone of Object.keys(ZONE_INFO)) assert.equal(componentFromObject(`${zone}::frame`),zone);
  for(const name of ['Habitat structure::frame','Inspection camera','Evidence retrieval scan','Unknown::dark',null]) assert.equal(componentFromObject(name),undefined);
});
test('every cabin part has finite renderable geometry, valid faces and a known finish',()=>{
  const parts=createCabinModel();
  assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
  for(const part of parts) {
    assert.ok(FINISHES[part.finish]);
    const {vertices,faces}=partGeometry(part);
    assert.ok(vertices.every(v=>v.length===3 && v.every(Number.isFinite)));
    assert.ok(faces.every(f=>f.length>=3 && f.every(i=>Number.isInteger(i)&&i>=0&&i<vertices.length)));
    assert.ok(part.size.every(v=>v>0));
  }
});
test('each selectable assembly has spatial depth and remains inside the pressure deck bounds',()=>{
  const parts=createCabinModel();
  for(const zone of Object.keys(ZONE_INFO)) {
    const vertices=parts.filter(p=>p.zone===zone).flatMap(p=>partGeometry(p).vertices);
    assert.ok(vertices.length>0);
    const min=[0,1,2].map(axis=>Math.min(...vertices.map(v=>v[axis])));
    const max=[0,1,2].map(axis=>Math.max(...vertices.map(v=>v[axis])));
    assert.ok(max[2]-min[2]>20,'An assembly cannot collapse into a flat diagram');
    assert.ok(min[0]>=-372 && max[0]<=372);
    assert.ok(min[1]>=0 && max[1]<=360);
    assert.ok(min[2]>=-242 && max[2]<=240);
  }
});
