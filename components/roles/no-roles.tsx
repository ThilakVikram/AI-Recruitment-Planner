import { NewRoleButton } from "./new-role-button";

export function NoRoles() {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="font-display text-xl font-semibold">Create your first role</h1>
      <p className="mt-2 text-sm text-muted">
        Each role is an isolated recruiting workspace with its own seven-stage workflow, CVs, candidates and tracker.
      </p>
      <div className="mt-5">
        <NewRoleButton label="+ New Role" className="btn-primary" />
      </div>
    </div>
  );
}
