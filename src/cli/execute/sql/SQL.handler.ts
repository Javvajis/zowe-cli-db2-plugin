/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { AbstractSession, ICommandHandler, IHandlerParameters, IProfile, ImperativeError, TextUtils } from "@brightside/imperative";
import { ExecuteSQL, IDB2Session } from "../../../";
import * as fs from "fs";
import { DB2BaseHandler } from "../../DB2BaseHandler";
import { DB2Session } from "../../DB2Sessions";

/**
 * Command handler for executing of SQL queries
 * @export
 * @class SQLHandler
 * @implements {ICommandHandler}
 */
export default class SQLHandler extends DB2BaseHandler {
    public async processWithDB2Session(params: IHandlerParameters, session: AbstractSession, profile?: IProfile): Promise<void> {
        // console.log(session, profile);
        let DB2session: IDB2Session;
        if (profile) {
            DB2session = {
                hostname: session.ISession.hostname || profile.hostname,
                port: session.ISession.port || profile.port,
                username: session.ISession.user || profile.user,
                password: session.ISession.password || profile.password,
                database: session.ISession.tokenType || profile.tokenType,
                sslFile: session.ISession.tokenValue || profile.tokenValue,
            };
        } else {
            DB2session = {
                hostname: session.ISession.hostname,
                port: session.ISession.port,
                username: session.ISession.user,
                password: session.ISession.password,
                database: session.ISession.tokenType,
                sslFile: session.ISession.tokenValue,
            };
        }

        let query;
        if (params.arguments.file) {
            try {
                query = fs.readFileSync(params.arguments.file, "utf-8").toString();
            }
            catch (err) {
                throw new ImperativeError({ msg: err.toString() });
            }
        } else {
            query = params.arguments.query;
        }

        const executor = new ExecuteSQL(DB2session);

        const response = executor.execute(query);
        const responses: any[] = [];
        let result;
        let resultset = 1;

        // Print out the response
        while (!(result = response.next()).done) {
            responses.push(result.value);
            params.response.console.log(`Result #${resultset}`);
            params.response.console.log(TextUtils.prettyJson(result.value));
            resultset++;
        }

        // Return as an object when using --response-format-json
        params.response.data.setObj(responses);

    }
}
