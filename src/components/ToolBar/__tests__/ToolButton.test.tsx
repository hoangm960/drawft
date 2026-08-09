import { render, screen, fireEvent } from "@testing-library/react";
import ToolButton from "../ToolButton";

describe("ToolButton", () => {
    const icon = "icon.svg";
    const tooltip = "Rectangle";
    const onClick = jest.fn();

    beforeEach(() => {
        onClick.mockClear();
    });

    test("renders the icon image with src and alt tooltip", () => {
        render(<ToolButton icon={icon} onClick={onClick} tooltip={tooltip} />);

        const img = screen.getByAltText(tooltip);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", icon);
    });

    test("applies the tooltip as the title attribute", () => {
        render(<ToolButton icon={icon} onClick={onClick} tooltip={tooltip} />);

        expect(screen.getByTitle(tooltip)).toBeInTheDocument();
    });

    test("calls onClick when clicked", () => {
        render(<ToolButton icon={icon} onClick={onClick} tooltip={tooltip} />);

        fireEvent.click(screen.getByTitle(tooltip));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test("does not call onClick when disabled", () => {
        render(
            <ToolButton
                icon={icon}
                onClick={onClick}
                tooltip={tooltip}
                disabled
            />
        );

        fireEvent.click(screen.getByTitle(tooltip));

        expect(onClick).not.toHaveBeenCalled();
    });

    test("applies active styling when active", () => {
        render(
            <ToolButton
                icon={icon}
                onClick={onClick}
                tooltip={tooltip}
                isActive
            />
        );

        expect(screen.getByTitle(tooltip)).toHaveClass("bg-gray-500");
    });

    test("applies inactive styling when not active", () => {
        render(<ToolButton icon={icon} onClick={onClick} tooltip={tooltip} />);

        expect(screen.getByTitle(tooltip)).toHaveClass("bg-gray-300");
    });
});
