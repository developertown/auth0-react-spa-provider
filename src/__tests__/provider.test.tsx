import { render } from "@testing-library/react";
import { createBrowserHistory } from "history";
import React, { ReactElement } from "react";
import { act } from "react-dom/test-utils";

import { Auth0Provider } from "../provider";

describe("Auth0Provider", () => {
  describe("renderLoading view", () => {
    it("renders null when no loading view is supplied", async () => {
      await act(async () => {
        const { container } = await render(
          <Auth0Provider client_id={""} domain={""} history={createBrowserHistory()}>
            <div>contents</div>
          </Auth0Provider>,
        );

        // console.log(x.container.childElementCount);
        expect(container.childElementCount).toEqual(0);
      });
    });

    it("renders the loading view when supplied", async () => {
      await act(async () => {
        const { container } = await render(
          <Auth0Provider
            client_id={""}
            domain={""}
            renderLoading={(): ReactElement => <div data-testid="1">loading!</div>}
            history={createBrowserHistory()}
          >
            <div>contents</div>
          </Auth0Provider>,
        );

        expect(container.childElementCount).toEqual(1);
      });
    });
  });
});
