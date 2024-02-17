import {marker} from '@ngneat/transloco-keys-manager/marker';

export interface Grade {
  name: string;
  value: number;
}

export const GRADES: { [scaleName: string]: Grade[] } = {
  FB: [
    {
      name: marker('CLOSED_PROJECT'),
      value: -2
    },
    {
      name: marker('OPEN_PROJECT'),
      value: -1
    },
    {
      name: marker('UNGRADED'),
      value: 0
    },
    {
      name: marker('1'),
      value: 1
    },
    {
      name: marker('2'),
      value: 2
    },
    {
      name: marker('3'),
      value: 3
    },
    {
      name: marker('4A'),
      value: 4
    },
    {
      name: marker('4B'),
      value: 5
    },
    {
      name: marker('4C'),
      value: 6
    },
    {
      name: marker('5A'),
      value: 7
    },
    {
      name: marker('5B'),
      value: 8
    },
    {
      name: marker('5C'),
      value: 9
    },
    {
      name: marker('6A'),
      value: 10
    },
    {
      name: marker('6A+'),
      value: 11
    },
    {
      name: marker('6B'),
      value: 12
    },
    {
      name: marker('6B+'),
      value: 13
    },
    {
      name: marker('6C'),
      value: 14
    },
    {
      name: marker('6C+'),
      value: 15
    },
    {
      name: marker('7A'),
      value: 16
    },
    {
      name: marker('7A+'),
      value: 17
    },
    {
      name: marker('7B'),
      value: 18
    },
    {
      name: marker('7B+'),
      value: 19
    },
    {
      name: marker('7C'),
      value: 20
    },
    {
      name: marker('7C+'),
      value: 21
    },
    {
      name: marker('8A'),
      value: 22
    },
    {
      name: marker('8A+'),
      value: 23
    },
    {
      name: marker('8B'),
      value: 24
    },
    {
      name: marker('8B+'),
      value: 25
    },
    {
      name: marker('8C'),
      value: 26
    },
    {
      name: marker('8C+'),
      value: 27
    },
    {
      name: marker('9A'),
      value: 28
    },
    {
      name: marker('9A+'),
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

/**
 * Parses a grade.
 * @param payload Payload containing the grade information.
 */
export const deserializeGrade = (payload: any): Grade => {
  return gradeMap.FB[payload.gradeName]
}
