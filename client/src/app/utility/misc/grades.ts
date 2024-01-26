export interface Grade {
  name: string;
  value: number;
}

export const GRADES: { [scaleName: string]: Grade[] } = {
  FB: [
    {
      name: '1',
      value: 1
    },
    {
      name: '2',
      value: 2
    },
    {
      name: '3',
      value: 3
    },
    {
      name: '4A',
      value: 4
    },
    {
      name: '4B',
      value: 5
    },
    {
      name: '4C',
      value: 6
    },
    {
      name: '5A',
      value: 7
    },
    {
      name: '5B',
      value: 8
    },
    {
      name: '5C',
      value: 9
    },
    {
      name: '6A',
      value: 10
    },
    {
      name: '6A+',
      value: 11
    },
    {
      name: '6B',
      value: 12
    },
    {
      name: '6B+',
      value: 13
    },
    {
      name: '6C',
      value: 14
    },
    {
      name: '6C+',
      value: 15
    },
    {
      name: '7A',
      value: 16
    },
    {
      name: '7A+',
      value: 17
    },
    {
      name: '7B',
      value: 18
    },
    {
      name: '7B+',
      value: 19
    },
    {
      name: '7C',
      value: 20
    },
    {
      name: '7C+',
      value: 21
    },
    {
      name: '8A',
      value: 22
    },
    {
      name: '8A+',
      value: 23
    },
    {
      name: '8B',
      value: 24
    },
    {
      name: '8B+',
      value: 25
    },
    {
      name: '8C',
      value: 26
    },
    {
      name: '8C+',
      value: 27
    },
    {
      name: '9A',
      value: 28
    },
    {
      name: '9A+',
      value: 29
    },
  ]
}

export const gradeMap: { [scaleName: string]: { [name: string]: Grade } } = {}

function buildGradeMap() {
  for (const scaleName in GRADES) {
    gradeMap[scaleName] = {}
    GRADES[scaleName].map(grade => {
      gradeMap[scaleName][grade.name] = grade;
    });
  }
}

buildGradeMap();
