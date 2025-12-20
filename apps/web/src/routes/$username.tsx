import { createFileRoute } from "@tanstack/react-router";
import { AppDashboard } from "@/components/app-dashboard";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/$username")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuthStore();

  return (
    <AppDashboard>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl tracking-tight">
            {username === user?.login ? "Your Profile" : `@${username}`}
          </h1>
          <p className="text-muted-foreground">
            {username === user?.login
              ? "View and manage your profile."
              : `View ${username}'s profile.`}
          </p>
        </div>
        {user && username === user.login && (
          <div className="mt-4 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">Profile Information</h2>
              <div className="mt-2 space-y-2 text-sm">
                {user.name && (
                  <div>
                    <span className="font-medium">Name:</span> {user.name}
                  </div>
                )}
                <div>
                  <span className="font-medium">Username:</span> @{user.login}
                </div>
                {user.bio && (
                  <div>
                    <span className="font-medium">Bio:</span> {user.bio}
                  </div>
                )}
                {user.email && (
                  <div>
                    <span className="font-medium">Email:</span> {user.email}
                  </div>
                )}
                <div>
                  <span className="font-medium">Public Repositories:</span>{" "}
                  {user.public_repos}
                </div>
                <div>
                  <span className="font-medium">Following:</span>{" "}
                  {user.following}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppDashboard>
  );
}
