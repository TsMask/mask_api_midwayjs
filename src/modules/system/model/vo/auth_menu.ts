/** Semantic auth menu used by /auth/menus. */
export class AuthMenu {
  id: number;
  kind: 'directory' | 'page' | 'iframe' | 'external';
  title: string;
  path: string;
  icon?: string;
  hidden?: boolean;
  cache?: boolean;
  target?: string;
  component?: string;
  children: AuthMenu[];
}
