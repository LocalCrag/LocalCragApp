interface Point {
  x: number;
  y: number;
}

export interface Label {
  text: string;
  position: Point;
  width: number;
  height: number;
  pointFeature: Point;
  searchSpace?: Point[];
}

interface Move {
  label: Label;
  position: Point;
  improvement: number;
}

/**
 * An algorithm to calculate label positions using discrete gradient descent as described in J Christensen, J Marks,
 * S Shieber 1995 (https://www.eecs.harvard.edu/~shieber/Biblio/Papers/tog-final.pdf).
 * This version keeps a rather small searchspace of 9 positions per label as the usecase is very limited. Conflicts to
 * the default placement only arise in two scenarios:
 *  1. Label clipping with the image boundaries
 *  2. Label overlap (e.g. two lines with the same start but different exits)
 */
export class PointFeatureLabelPlacement {
  private readonly plainWidth: number;
  private readonly plainHeight: number;
  private readonly labels: Label[];
  private searchSpacePenalties = [0, 0.1, 0.15, 0.2, 0.2, 0.3, 0.3, 0.3, 0.3];

  constructor(plainWidth: number, plainHeight: number, labels: Label[]) {
    this.plainWidth = plainWidth;
    this.plainHeight = plainHeight;
    this.labels = labels;
    this.buildSearchSpaces();
    this.assignDefaultLabelPlacements();
  }

  /**
   * For each label a search space of 9 possible label placements is calculated.
   */
  buildSearchSpaces() {
    this.labels.map((label) => {
      label.searchSpace = [];

      // Default placement: center of point feature (start of the line)
      label.searchSpace.push(label.pointFeature);

      // Translated default position on x _or_ y-axis
      label.searchSpace.push({
        x: label.pointFeature.x,
        y: label.pointFeature.y + 1.1 * label.height,
      });
      label.searchSpace.push({
        x: label.pointFeature.x,
        y: label.pointFeature.y - 1.1 * label.height,
      });
      label.searchSpace.push({
        x: label.pointFeature.x + 1.1 * label.width,
        y: label.pointFeature.y,
      });
      label.searchSpace.push({
        x: label.pointFeature.x - 1.1 * label.width,
        y: label.pointFeature.y,
      });

      // Translated default position on x _and_ y-axis
      label.searchSpace.push({
        x: label.pointFeature.x + 0.75 * label.width,
        y: label.pointFeature.y + 0.75 * label.height,
      });
      label.searchSpace.push({
        x: label.pointFeature.x + 0.75 * label.width,
        y: label.pointFeature.y - 0.75 * label.height,
      });
      label.searchSpace.push({
        x: label.pointFeature.x - 0.75 * label.width,
        y: label.pointFeature.y + 0.75 * label.height,
      });
      label.searchSpace.push({
        x: label.pointFeature.x - 0.75 * label.width,
        y: label.pointFeature.y - 0.75 * label.height,
      });
    });
  }

  assignDefaultLabelPlacements() {
    this.labels.map((label) => (label.position = label.searchSpace[0]));
  }

  /**
   * Executes the discrete gradient descent algorithm for point feature label placement.
   */
  discreteGradientDescent() {
    let hasImproved = true;
    while (hasImproved) {
      const moves: Move[] = [];
      for (let label of this.labels) {
        const currentValue = this.calculateObjectiveFunctionValue(
          label,
          label.position,
          this.searchSpacePenalties[label.searchSpace.indexOf(label.position)],
        );
        for (let possiblePosition of label.searchSpace) {
          moves.push({
            label,
            position: possiblePosition,
            improvement:
              this.calculateObjectiveFunctionValue(
                label,
                possiblePosition,
                this.searchSpacePenalties[
                  label.searchSpace.indexOf(possiblePosition)
                ],
              ) - currentValue,
          });
        }
      }
      // Objective function value should be minimized to get an improvement of label positioning
      moves.sort((a, b) => a.improvement - b.improvement);
      moves[0].label.position = moves[0].position;
      hasImproved = moves[0].improvement < 0;
    }
  }

  /**
   * The algorithm tries to minimize the value of this function in order to optimize label placements. We use three
   * heuristics for defining the placement quality:
   *  - Label clipping with the image borders gets penalized
   *  - Label overlap gets penalized
   *  - A start penalty is included. "Optical pleasing" positions have a lower start penalty
   * @param label Label to calculate the placement quality value for.
   * @param position Possible label position that is evaluated.
   * @param startPenalty Start penalty for the evaluated position.
   */
  calculateObjectiveFunctionValue(
    label: Label,
    position: Point,
    startPenalty: number,
  ): number {
    let value = startPenalty;
    // Penalize clipping
    value +=
      1 -
      this.getNormalizedLabelOverlap(
        label,
        {
          position: { x: this.plainWidth / 2, y: this.plainHeight / 2 },
          width: this.plainWidth,
          height: this.plainHeight,
          pointFeature: { x: 0, y: 0 },
          text: '',
        },
        position,
      );
    // Penalize label overlap
    for (let labelToCheck of this.labels) {
      if (labelToCheck === label) {
        continue;
      }
      value += this.getNormalizedLabelOverlap(label, labelToCheck, position);
    }
    return value;
  }

  getNormalizedLabelOverlap(
    label1: Label,
    label2: Label,
    possibleLabel1Position: Point,
  ) {
    const rect1 = {
      left: possibleLabel1Position.x - label1.width / 2,
      right: possibleLabel1Position.x + label1.width / 2,
      top: possibleLabel1Position.y - label1.height / 2,
      bottom: possibleLabel1Position.y + label1.height / 2,
    };
    const rect2 = {
      left: label2.position.x - label2.width / 2,
      right: label2.position.x + label2.width / 2,
      top: label2.position.y - label2.height / 2,
      bottom: label2.position.y + label2.height / 2,
    };
    const label1Area = label1.width * label1.height;
    const label2Area = label2.width * label2.height;
    const xOverlap = Math.max(
      0,
      Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left),
    );
    const yOverlap = Math.max(
      0,
      Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top),
    );
    return (xOverlap * yOverlap) / Math.min(label1Area, label2Area);
  }
}
