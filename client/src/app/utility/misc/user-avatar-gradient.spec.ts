import {
  fnv1a32,
  userAvatarGradientCss,
  userInitials,
} from './user-avatar-gradient';

describe('userAvatarGradient', () => {
  it('userAvatarGradientCss is stable for a given seed', () => {
    const a = userAvatarGradientCss('jane-climber');
    const b = userAvatarGradientCss('jane-climber');
    expect(a).toBe(b);
    expect(a).toContain('linear-gradient');
  });

  it('userAvatarGradientCss differs for different seeds', () => {
    expect(userAvatarGradientCss('alice')).not.toBe(
      userAvatarGradientCss('bob'),
    );
  });

  it('fnv1a32 is deterministic', () => {
    expect(fnv1a32('slug-1')).toBe(fnv1a32('slug-1'));
  });

  it('userInitials returns two letters when possible', () => {
    expect(userInitials('Jane', 'Doe')).toBe('JD');
  });

  it('userInitials handles missing parts', () => {
    expect(userInitials('', 'solo')).toBe('S');
    expect(userInitials('  ', null)).toBe('?');
  });
});
