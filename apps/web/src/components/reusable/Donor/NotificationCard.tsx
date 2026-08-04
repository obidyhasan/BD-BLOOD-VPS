import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const NotificationCard = () => {
  return (
    <div>
      <div className="bg-background z-10 max-w-80 rounded-md border p-4">
        <div className="flex grow gap-3">
          <div className="flex grow flex-col gap-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">
                  Something requires your action!
                </p>

                <X className="w-4 text-muted-foreground" />
              </div>

              <p className="text-muted-foreground text-sm">
                It conveys that a specific action is needed to resolve or
                address a situation.
              </p>
            </div>
            <div>
              <Button>Learn more</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
