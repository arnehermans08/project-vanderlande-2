// use correct dB
use dbVdl

// Create DB's

db.createCollection('metings')
db.createCollection('carts')

// sample data metings

db.metings.insertMany([
  {
    id: 1,
    type: 'az1',
    waarde: 62,
    tijd: ISODate('2026-05-06T11:30:43.863Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ax1',
    waarde: 41,
    tijd: ISODate('2026-05-06T11:30:46.127Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ay1',
    waarde: 92,
    tijd: ISODate('2026-05-06T11:30:46.321Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'az1',
    waarde: 68,
    tijd: ISODate('2026-05-06T11:30:46.524Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ax1',
    waarde: 72,
    tijd: ISODate('2026-05-06T11:30:49.715Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ay1',
    waarde: 69,
    tijd: ISODate('2026-05-06T11:30:49.915Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'az1',
    waarde: 63,
    tijd: ISODate('2026-05-06T11:30:50.114Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ax1',
    waarde: 2,
    tijd: ISODate('2026-05-06T11:30:53.314Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ay1',
    waarde: 56,
    tijd: ISODate('2026-05-06T11:30:53.523Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'az1',
    waarde: 0,
    tijd: ISODate('2026-05-06T11:30:53.716Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ax1',
    waarde: 48,
    tijd: ISODate('2026-05-06T11:30:56.909Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ay1',
    waarde: 10,
    tijd: ISODate('2026-05-06T11:30:57.119Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'az1',
    waarde: 80,
    tijd: ISODate('2026-05-06T11:30:57.311Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ax1',
    waarde: 7,
    tijd: ISODate('2026-05-06T11:31:00.510Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ay1',
    waarde: 43,
    tijd: ISODate('2026-05-06T11:31:00.710Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'az1',
    waarde: 35,
    tijd: ISODate('2026-05-06T11:31:00.911Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ax1',
    waarde: 61,
    tijd: ISODate('2026-05-06T11:31:04.111Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ay1',
    waarde: 99,
    tijd: ISODate('2026-05-06T11:31:04.311Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'az1',
    waarde: 19,
    tijd: ISODate('2026-05-06T11:31:04.510Z'),
    __v: 0
  },
  {
    id: 1,
    type: 'ax1',
    waarde: 31,
    tijd: ISODate('2026-05-06T11:31:07.713Z'),
    __v: 0
  }
])


// sample data carts


db.carts.insertMany([
  {
    cartID: 1,
    sensoren: [ 1, 2, 3, 4 ]
  },
  {
    cartID: 2,
    sensoren: [ 5, 6, 7, 8 ]
  }
])

