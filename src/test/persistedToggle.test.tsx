import { describe, it, expect, beforeEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { usePersistedToggle } from "@/hooks/usePersistedToggle";
import { LS_MOSTRAR_FORTALEZAS, LS_MOSTRAR_AREAS } from "@/pages/student/PsicometriaTest";
import { Switch } from "@/components/ui/switch";

beforeEach(() => {
  localStorage.clear();
});

function Harness() {
  const [fort, setFort] = usePersistedToggle(LS_MOSTRAR_FORTALEZAS, true);
  const [areas, setAreas] = usePersistedToggle(LS_MOSTRAR_AREAS, true);
  return (
    <div>
      <Switch data-testid="sw-fort" checked={fort} onCheckedChange={setFort} />
      <Switch data-testid="sw-areas" checked={areas} onCheckedChange={setAreas} />
      <span data-testid="state">{`${fort}|${areas}`}</span>
    </div>
  );
}

describe("Toggles persistentes (Fortalezas / Áreas a fortalecer)", () => {
  it("renderiza ambos switches con estado inicial true", () => {
    render(<Harness />);
    expect(screen.getByTestId("sw-fort")).toBeInTheDocument();
    expect(screen.getByTestId("sw-areas")).toBeInTheDocument();
    expect(screen.getByTestId("state").textContent).toBe("true|true");
  });

  it("cambia el estado al hacer click y persiste en localStorage", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("sw-fort"));
    expect(screen.getByTestId("state").textContent).toBe("false|true");
    expect(localStorage.getItem(LS_MOSTRAR_FORTALEZAS)).toBe("0");
    expect(localStorage.getItem(LS_MOSTRAR_AREAS)).toBe("1");

    fireEvent.click(screen.getByTestId("sw-areas"));
    expect(screen.getByTestId("state").textContent).toBe("false|false");
    expect(localStorage.getItem(LS_MOSTRAR_AREAS)).toBe("0");
  });

  it("al recargar (remontaje) restaura el último valor desde localStorage", () => {
    const { unmount } = render(<Harness />);
    fireEvent.click(screen.getByTestId("sw-fort"));
    expect(localStorage.getItem(LS_MOSTRAR_FORTALEZAS)).toBe("0");
    unmount();

    render(<Harness />);
    expect(screen.getByTestId("state").textContent).toBe("false|true");
  });

  it("usa el valor por defecto cuando no hay nada en localStorage", () => {
    function HD() {
      const [v] = usePersistedToggle("medd:test:nuevo", false);
      return <span data-testid="def">{String(v)}</span>;
    }
    render(<HD />);
    expect(screen.getByTestId("def").textContent).toBe("false");
  });

  it("setValue programático también persiste", () => {
    function H() {
      const [v, setV] = usePersistedToggle("medd:test:prog", true);
      return (
        <button data-testid="btn" onClick={() => setV(false)}>
          {String(v)}
        </button>
      );
    }
    render(<H />);
    act(() => {
      fireEvent.click(screen.getByTestId("btn"));
    });
    expect(localStorage.getItem("medd:test:prog")).toBe("0");
  });
});
