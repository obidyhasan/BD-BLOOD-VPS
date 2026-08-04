"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button, ButtonArrow } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Control, FieldValues, Path } from "react-hook-form";

interface Option {
  label: string;
  value: string;
}

interface ComboBoxProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string | React.ReactNode;
  placeholder?: string;
  required?: boolean;
  requiredMessage?: string;
  disabled?: boolean;
  options?: Option[];
  className?: string;
}

export const ComboBox = <TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder = "Select option",
  required = false,
  requiredMessage,
  disabled = false,
  options = [],
  className,
}: ComboBoxProps<TFieldValues>) => {
  const [open, setOpen] = React.useState(false);

  return (
    <FormField
      control={control}
      name={name}
      rules={
        required
          ? { required: requiredMessage ?? `${label} is required` }
          : undefined
      }
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-foreground">
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>

          <FormControl>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  mode="input"
                  placeholder={!field.value}
                  aria-expanded={open}
                  disabled={disabled}
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {field.value
                      ? options.find((o) => o.value === field.value)?.label
                      : placeholder}
                  </span>
                  <ButtonArrow />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
                <Command>
                  <CommandInput
                    placeholder={`Search ${
                      typeof label === "string" ? label.toLowerCase() : ""
                    }...`}
                  />
                  <CommandList>
                    <CommandEmpty>No option found.</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(currentValue) => {
                            field.onChange(
                              currentValue === field.value ? "" : currentValue,
                            );
                            setOpen(false);
                          }}
                        >
                          <span className="truncate">{option.label}</span>
                          {field.value === option.value && <Check />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};
