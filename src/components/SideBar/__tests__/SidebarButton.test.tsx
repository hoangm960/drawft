import { render, screen, fireEvent } from "@testing-library/react";
import SidebarButton from "../SidebarButton";

describe("SidebarButton", () => {
    const icon = "icon.svg";
    const tooltip = "Stroke";

    test("renders the icon image with src and alt tooltip", () => {
        render(<SidebarButton icon={icon} tooltip={tooltip} />);

        const img = screen.getByAltText(tooltip);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", icon);
    });

    test("applies the tooltip as the title attribute", () => {
        render(<SidebarButton icon={icon} tooltip={tooltip} />);

        expect(screen.getByTitle(tooltip)).toBeInTheDocument();
    });

    test("is rendered as a disabled placeholder when disabled", () => {
        render(<SidebarButton icon={icon} tooltip={tooltip} disabled />);

        expect(screen.getByTitle(tooltip)).toHaveClass(
            "opacity-50",
            "pointer-events-none"
        );
    });

    test("calls onClick when clicked", () => {
        const onClick = jest.fn();
        render(
            <SidebarButton icon={icon} tooltip={tooltip} onClick={onClick} />
        );

        fireEvent.click(screen.getByTitle(tooltip));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test("does not call onClick when disabled", () => {
        const onClick = jest.fn();
        render(
            <SidebarButton
                icon={icon}
                tooltip={tooltip}
                onClick={onClick}
                disabled
            />
        );

        fireEvent.click(screen.getByTitle(tooltip));

        expect(onClick).not.toHaveBeenCalled();
    });

    test("applies active styling when active", () => {
        render(<SidebarButton icon={icon} tooltip={tooltip} isActive />);

        expect(screen.getByTitle(tooltip)).toHaveClass("bg-gray-500");
    });

    test("constrains the icon to a fixed size", () => {
        render(<SidebarButton icon={icon} tooltip={tooltip} />);

        expect(screen.getByAltText(tooltip)).toHaveClass("w-10", "h-10");
    });
});
