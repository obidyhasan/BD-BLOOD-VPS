import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import NotificationCard from "./NotificationCard";

const NotificationItem = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"outline"} size={"icon"} className="rounded-full">
          <Bell />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="space-y-1">
        <NotificationCard />
        <NotificationCard />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationItem;
