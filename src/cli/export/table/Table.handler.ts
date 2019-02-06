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

import { ICommandHandler, IHandlerParameters, ImperativeError, AbstractSession, IProfile } from "@brightside/imperative";
import { ExportTableSQL, IDB2Session } from "../../../";
import * as fs from "fs";
import { DB2BaseHandler } from "../../DB2BaseHandler";
/**
 * Command handler for exporting a DB2 table
 * @export
 * @class TableHandler
 * @implements {ICommandHandler}
 */
export default class TableHandler extends DB2BaseHandler {
    public async processWithDB2Session(params: IHandlerParameters, session: AbstractSession, profile?: IProfile): Promise<void>  {
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
        let [database, table] = params.arguments.table.split(".");
        if (table === null) {
            table = database;
            database = DB2session.database;
        }
        let outFile;
        if (params.arguments.outfile) {
            try {
                outFile = fs.openSync(params.arguments.outfile, "w");
            }
            catch (err) {
                throw new ImperativeError({msg: err.toString()});
            }
        }
        const sqlExporter = new ExportTableSQL(DB2session, database, table);
        await sqlExporter.init();
        const statements = sqlExporter.export();
        let statement;
        while (!(statement = statements.next()).done) {
            if (params.arguments.outfile) {
                // Write statements to a file
                fs.writeSync(outFile, statement.value);
            }
            else {
                // Print out the response
                params.response.console.log(statement.value);

            }
        }
        if (params.arguments.outfile) {
            fs.closeSync(outFile);
        }

    }
}
