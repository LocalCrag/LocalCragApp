import { User } from './user';

export class Reaction {
  emoji: string;
  user: User;

  public static deserialize(payload: any): Reaction {
    const reaction = new Reaction();
    reaction.emoji = payload.emoji;
    reaction.user = User.deserialize(payload.user);
    return reaction;
  }
}

export type Reactions = Reaction[];
